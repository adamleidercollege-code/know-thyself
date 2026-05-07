"use client";

import { useEffect, useRef } from "react";
import { useChatStream } from "./useChatStream";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import type { Assessment } from "@/lib/schema";
import type { ChatMessage } from "./types";

type Props = {
  onAssessmentReady: (transcript: ChatMessage[], draftJson: Assessment) => void;
};

export function ChatView({ onAssessmentReady }: Props) {
  const { messages, pending, status, tool, error, send, retryLast } = useChatStream();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      void send(null);
    }
  }, [send]);

  useEffect(() => {
    if (status === "tool_received" && tool && tool.toolName === "submit_assessment") {
      onAssessmentReady(messages, tool.input as Assessment);
    }
  }, [status, tool, messages, onAssessmentReady]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 80px)", maxHeight: "calc(100dvh - 80px)", maxWidth: 720, margin: "0 auto", width: "100%", minHeight: 0, overflow: "hidden" }}>
      <div className="label" style={{ padding: "16px 24px 0" }}>Know Thyself</div>
      <MessageList messages={messages} pending={pending ?? undefined} showTypingIndicator={status === "streaming"} />
      {error ? (
        <div style={{ padding: 16, textAlign: "center" }}>
          <p style={{ color: "var(--color-muted)", marginBottom: 12 }}>{error}</p>
          <button onClick={retryLast} className="label" style={{ background: "none", border: "1px solid var(--color-accent)", padding: "8px 16px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      ) : (
        <Composer
          disabled={
            status === "streaming" ||
            status === "finalizing" ||
            status === "tool_received"
          }
          onSend={(t) => void send(t)}
        />
      )}
    </div>
  );
}
