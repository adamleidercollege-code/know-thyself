"use client";

import { useState } from "react";
import { FOOTER_SECTIONS } from "@/lib/prompts/footer-copy";
import { FooterPanel } from "./FooterPanel";

export function Footer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = FOOTER_SECTIONS.find((s) => s.id === openId);

  return (
    <>
      <footer
        className="kt-footer-bar"
        style={{
          position: "sticky",
          bottom: 0,
          borderTop: "1px solid var(--color-rule)",
          background: "var(--color-bg)",
          padding: "14px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px 24px",
          justifyContent: "center",
          zIndex: 40,
        }}
      >
        {FOOTER_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenId(s.id)}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--color-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {s.title}
          </button>
        ))}
      </footer>
      {open && (
        <FooterPanel title={open.title} body={open.body} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
