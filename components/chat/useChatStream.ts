"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./types";
import { sanitizeAssistantText } from "./sanitize";

type Status = "idle" | "streaming" | "finalizing" | "tool_received" | "error";

type ToolPayload = { toolName: string; input: unknown };

const MAX_INVISIBLE_RETRIES = 2;

function looksLikeAssessmentInput(input: unknown): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    Array.isArray((input as { metrics?: unknown }).metrics)
  );
}

// Closing-statement vocabulary from the system prompt's example pattern
// ("That gives me a good picture — I'll put your results together now.").
// Requiring one of these words avoids false-firing on imperative questions
// like "Walk me through your typical week" that omit the question mark.
const CLOSING_VOCAB_RX =
  /\b(results?|together|wrap[\w-]*|finished|complete[d]?|good picture|synthesi[sz]e|put together|all set)\b/i;

function looksLikeClosing(visibleText: string): boolean {
  const t = visibleText.trim();
  if (t.length < 4) return false;
  if (t.includes("?")) return false;
  return CLOSING_VOCAB_RX.test(t);
}

export function useChatStream(initial: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [tool, setTool] = useState<ToolPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const invisibleRetriesRef = useRef(0);
  const sendRef = useRef<((userText: string | null) => Promise<void>) | null>(null);

  const send = useCallback(async (userText: string | null) => {
    setError(null);
    setTool(null);
    let nextHistory = messages;
    if (userText !== null) {
      nextHistory = [...messages, { role: "user" as const, content: userText }];
      setMessages(nextHistory);
      invisibleRetriesRef.current = 0;
    }
    setPending("");
    setStatus("streaming");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let assistantText = "";
    let toolInputBuffer = "";
    let toolName: string | null = null;
    let stopReason: string | null = null;
    let streamDone = false;

    let displayed = "";
    const pumpDone = new Promise<void>((resolve) => {
      const id = setInterval(() => {
        const target = sanitizeAssistantText(assistantText, !streamDone);
        if (displayed.length > target.length) {
          displayed = target;
          setPending(displayed);
          return;
        }
        if (displayed.length < target.length) {
          const remaining = target.length - displayed.length;
          const step = remaining > 200 ? 8 : remaining > 80 ? 4 : remaining > 30 ? 2 : 1;
          displayed = target.slice(0, displayed.length + step);
          setPending(displayed);
          return;
        }
        if (streamDone) {
          clearInterval(id);
          resolve();
        }
      }, 20);
      ctrl.signal.addEventListener("abort", () => {
        clearInterval(id);
        resolve();
      });
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const lines = chunk.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const payload = dataLine.slice(6);
          if (eventLine?.slice(7) === "error") {
            let msg = "stream error";
            try {
              const parsed = JSON.parse(payload);
              if (typeof parsed?.message === "string") msg = parsed.message;
            } catch {}
            throw new Error(msg);
          }
          let evt: {
            type?: string;
            delta?: { type?: string; text?: string; partial_json?: string; stop_reason?: string };
            content_block?: { type?: string; name?: string };
            index?: number;
          };
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }
          if (evt.type === "content_block_start" && evt.content_block?.type === "tool_use") {
            toolName = evt.content_block.name ?? null;
            toolInputBuffer = "";
          } else if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            assistantText += evt.delta.text ?? "";
          } else if (evt.type === "content_block_delta" && evt.delta?.type === "input_json_delta") {
            toolInputBuffer += evt.delta.partial_json ?? "";
          } else if (evt.type === "message_delta") {
            const sr = evt.delta?.stop_reason;
            if (sr) stopReason = sr;
          }
        }
      }
    } catch (err) {
      streamDone = true;
      await pumpDone;
      const msg = err instanceof Error ? err.message : "stream error";
      setError(msg);
      setStatus("error");
      setPending(null);
      return;
    }

    streamDone = true;
    await pumpDone;

    if (assistantText) {
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    }
    setPending(null);

    // Inline tool call succeeded with parseable, structurally-valid input.
    if (stopReason === "tool_use" && toolName && toolInputBuffer) {
      try {
        const input = JSON.parse(toolInputBuffer);
        if (looksLikeAssessmentInput(input)) {
          setTool({ toolName, input });
          setStatus("tool_received");
          return;
        }
      } catch {
        // Tool JSON likely truncated by max_tokens — fall through to finalize.
      }
    }

    // Closing turn detected (statement, no question). Force the tool call via
    // /api/finalize, which uses tool_choice + a larger max_tokens budget so
    // the JSON cannot be truncated mid-stream.
    const visible = sanitizeAssistantText(assistantText);
    if (looksLikeClosing(visible)) {
      setStatus("finalizing");
      const transcriptForFinalize = assistantText
        ? [...nextHistory, { role: "assistant" as const, content: assistantText }]
        : nextHistory;
      try {
        const res = await fetch("/api/finalize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: transcriptForFinalize }),
        });
        if (!res.ok) throw new Error(`finalize HTTP ${res.status}`);
        const data = (await res.json()) as { assessment?: unknown; error?: string };
        if (!data.assessment) throw new Error(data.error ?? "finalize: no assessment");
        setTool({ toolName: "submit_assessment", input: data.assessment });
        setStatus("tool_received");
      } catch (err) {
        setError(err instanceof Error ? err.message : "finalize error");
        setStatus("error");
      }
      return;
    }

    // If the model emitted only scorecard/non-visible text, automatically
    // re-prompt so the user gets the next question without having to type
    // a filler message. Cap retries to avoid loops. Defer to a macrotask so
    // the just-scheduled setMessages commit before sendRef.current is read —
    // otherwise the retry would refetch with stale history.
    if (assistantText && !visible && invisibleRetriesRef.current < MAX_INVISIBLE_RETRIES) {
      invisibleRetriesRef.current += 1;
      setTimeout(() => {
        void sendRef.current?.(null);
      }, 0);
      return;
    }
    invisibleRetriesRef.current = 0;
    setStatus("idle");
  }, [messages]);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const retryLast = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      const trimmed = last?.role === "assistant" ? prev.slice(0, -1) : prev;
      return trimmed;
    });
    void send(null);
  }, [send]);

  return { messages, pending, status, tool, error, send, retryLast };
}
