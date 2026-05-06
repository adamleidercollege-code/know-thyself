"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "./types";

type Status = "idle" | "streaming" | "tool_received" | "error";

type ToolPayload = { toolName: string; input: unknown };

export function useChatStream(initial: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [tool, setTool] = useState<ToolPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (userText: string | null) => {
    setError(null);
    setTool(null);
    let nextHistory = messages;
    if (userText !== null) {
      nextHistory = [...messages, { role: "user" as const, content: userText }];
      setMessages(nextHistory);
    }
    setPending("");
    setStatus("streaming");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let assistantText = "";
    let toolInputBuffer = "";
    let toolName: string | null = null;
    let stopReason: string | null = null;

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
            setPending(assistantText);
          } else if (evt.type === "content_block_delta" && evt.delta?.type === "input_json_delta") {
            toolInputBuffer += evt.delta.partial_json ?? "";
          } else if (evt.type === "message_delta") {
            const sr = evt.delta?.stop_reason;
            if (sr) stopReason = sr;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "stream error";
      setError(msg);
      setStatus("error");
      setPending(null);
      return;
    }

    if (assistantText) {
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    }
    setPending(null);

    if (stopReason === "tool_use" && toolName) {
      try {
        const input = JSON.parse(toolInputBuffer);
        setTool({ toolName, input });
        setStatus("tool_received");
      } catch (err) {
        setError(err instanceof Error ? err.message : "bad tool JSON");
        setStatus("error");
      }
    } else {
      setStatus("idle");
    }
  }, [messages]);

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
