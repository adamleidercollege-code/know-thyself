"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
};

export function Composer({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-rule-soft)",
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        background: "var(--color-bg)",
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        rows={1}
        placeholder="Type your response…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        style={{
          flex: 1,
          fontFamily: "var(--font-serif)",
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--color-ink)",
          background: "var(--color-card)",
          border: "1px solid var(--color-rule-soft)",
          borderRadius: 12,
          padding: "12px 14px",
          resize: "none",
          maxHeight: 200,
          outline: "none",
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          fontWeight: 600,
          background: disabled ? "var(--color-tertiary)" : "var(--color-ink)",
          color: "var(--color-bg)",
          border: "none",
          borderRadius: 8,
          padding: "12px 18px",
          cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
