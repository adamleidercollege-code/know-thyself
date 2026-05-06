"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";

type Props = {
  messages: ChatMessage[];
  pending?: string;
  showTypingIndicator?: boolean;
};

export function MessageList({ messages, pending, showTypingIndicator }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, showTypingIndicator]);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {messages.map((m, i) => (
        <Bubble key={i} role={m.role} content={m.content} />
      ))}
      {pending !== undefined && <Bubble role="assistant" content={pending} />}
      {showTypingIndicator && messages[messages.length - 1]?.role === "user" && pending === undefined && (
        <div style={{ alignSelf: "flex-start", color: "var(--color-tertiary)", fontStyle: "italic" }}>…</div>
      )}
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        background: isUser ? "var(--color-card)" : "transparent",
        padding: isUser ? "10px 14px" : "0",
        borderRadius: isUser ? 12 : 0,
        border: isUser ? "1px solid var(--color-rule-soft)" : "none",
        fontFamily: "var(--font-serif)",
        fontSize: 16,
        lineHeight: 1.55,
        color: "var(--color-ink)",
        whiteSpace: "pre-wrap",
      }}
    >
      {content}
    </div>
  );
}
