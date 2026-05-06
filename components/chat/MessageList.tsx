"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";
import { sanitizeAssistantText } from "./sanitize";

type Props = {
  messages: ChatMessage[];
  pending?: string;
  showTypingIndicator?: boolean;
};

export function MessageList({ messages, pending, showTypingIndicator }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, showTypingIndicator]);

  const hasPendingText = pending !== undefined && pending.length > 0;
  const lastIsUser = messages[messages.length - 1]?.role === "user";
  const showWaiting =
    !hasPendingText &&
    lastIsUser &&
    (pending === "" || (showTypingIndicator && pending === undefined));

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        overflowAnchor: "none",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {messages.map((m, i) => {
        const content = m.role === "assistant" ? sanitizeAssistantText(m.content) : m.content;
        if (m.role === "assistant" && !content) return null;
        return <Bubble key={i} role={m.role} content={content} />;
      })}
      {hasPendingText && <Bubble role="assistant" content={pending!} />}
      {showWaiting && (
        <div
          style={{
            alignSelf: "flex-start",
            color: "var(--color-tertiary)",
            fontStyle: "italic",
            fontFamily: "var(--font-serif)",
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          …
        </div>
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
        wordBreak: "break-word",
      }}
    >
      {content}
    </div>
  );
}
