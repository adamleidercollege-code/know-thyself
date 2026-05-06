"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  body: React.ReactNode;
  onClose: () => void;
};

export function FooterPanel({ title, body, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={title}
      style={{
        position: "fixed",
        left: 0, right: 0, bottom: 0,
        height: "min(60vh, 600px)",
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-rule)",
        boxShadow: "0 -8px 32px rgba(0,0,0,.08)",
        zIndex: 50,
        overflow: "auto",
        padding: "32px 32px 64px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            float: "right",
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--color-accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close ✕
        </button>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: 28,
            margin: "0 0 18px",
            color: "var(--color-ink)",
          }}
        >
          {title}
        </h2>
        <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--color-ink)" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
