"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/schema";

type Props = {
  index: number;
  suggestion: Suggestion;
  alwaysOpen?: boolean;
};

export function SuggestionCard({ index, suggestion, alwaysOpen = false }: Props) {
  const [open, setOpen] = useState(alwaysOpen);
  const showDetail = open || alwaysOpen;
  return (
    <div
      style={{
        padding: "22px 0",
        borderTop: index === 0 ? "none" : "1px solid var(--color-rule-soft)",
        display: "grid",
        gridTemplateColumns: "36px 1fr",
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          color: "var(--color-accent)", fontSize: 22,
        }}
      >
        {index + 1}
      </span>
      <div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 19, margin: "0 0 4px" }}>
          {suggestion.title}
        </h3>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--color-muted)", margin: "0 0 10px" }}>
          {suggestion.summary}
        </p>
        {!alwaysOpen && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="label"
            style={{ fontSize: 11, color: "var(--color-accent)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {open ? "Show less ↑" : "Read more ↓"}
          </button>
        )}
        {showDetail && (
          <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.65, color: "var(--color-ink)" }}>
            {suggestion.detail}
          </p>
        )}
      </div>
    </div>
  );
}
