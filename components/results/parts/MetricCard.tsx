"use client";

import { useState } from "react";
import type { Metric } from "@/lib/schema";

type Props = { metric: Metric; alwaysOpen?: boolean };

export function MetricCard({ metric, alwaysOpen = false }: Props) {
  const [open, setOpen] = useState(alwaysOpen);
  const showDetail = open || alwaysOpen;
  return (
    <div
      style={{
        borderTop: "1px solid var(--color-rule)",
        padding: "24px 0 22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <span
          style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: 20,
          }}
        >
          {metric.name}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 30, lineHeight: 1 }}>{metric.score}</span>
          <span className="label" style={{ fontSize: 11, color: "var(--color-muted)" }}>/ 5</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            data-dot
            {...(n === metric.score ? { "data-dot-on": true } : {})}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              border: "1px solid var(--color-ink)",
              background: n === metric.score ? "var(--color-ink)" : "transparent",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 14.5, color: "var(--color-ink)", margin: "14px 0 12px", lineHeight: 1.55 }}>
        {metric.summary}
      </p>
      {!alwaysOpen && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="label"
          style={{
            fontSize: 11, fontWeight: 600, color: "var(--color-accent)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          {open ? "Show less ↑" : "Read more ↓"}
        </button>
      )}
      {showDetail && (
        <p style={{ fontSize: 14.5, color: "var(--color-ink)", margin: "12px 0 0", lineHeight: 1.6 }}>
          {metric.detail}
        </p>
      )}
      {metric.interactions.length > 0 && (
        <div
          style={{
            fontFamily: "var(--font-sans)", fontSize: 11,
            color: "var(--color-tertiary)", marginTop: 14,
            letterSpacing: ".04em",
          }}
        >
          Connects with {metric.interactions.join(", ")}
        </div>
      )}
    </div>
  );
}
