"use client";

import { useEffect } from "react";
import type { Assessment } from "@/lib/schema";
import type { ChatMessage } from "@/components/chat/types";

type Props = {
  transcript: ChatMessage[];
  draftJson: Assessment;
  onResults: (corrected: Assessment, fellBack: boolean) => void;
};

export function JudgingView({ transcript, draftJson, onResults }: Props) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript, draftJson }),
        });
        const data = await res.json();
        if (cancelled) return;
        onResults(data.correctedJson as Assessment, Boolean(data.draftFallback));
      } catch {
        if (!cancelled) onResults(draftJson, true);
      }
    })();
    return () => { cancelled = true; };
  }, [transcript, draftJson, onResults]);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 80px)", padding: 24, textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          fontSize: 22, color: "var(--color-ink)",
        }}
      >
        Putting your results together…
      </p>
    </div>
  );
}
