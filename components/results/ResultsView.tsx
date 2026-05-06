"use client";

import { useMemo, useState } from "react";
import type { Assessment } from "@/lib/schema";
import { buildSlideList } from "@/lib/slides";
import { Slideshow } from "./Slideshow";
import { FullResults } from "./FullResults";

type Props = {
  assessment: Assessment;
  fellBack: boolean;
};

export function ResultsView({ assessment, fellBack }: Props) {
  const [mode, setMode] = useState<"slideshow" | "full">("slideshow");
  const slides = useMemo(() => buildSlideList(assessment), [assessment]);

  return (
    <div>
      {fellBack && (
        <div
          role="status"
          style={{
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-rule-soft)",
            padding: "8px 16px",
            textAlign: "center",
          }}
        >
          <span className="label" style={{ color: "var(--color-muted)" }}>
            Results displayed without secondary review
          </span>
        </div>
      )}
      {mode === "slideshow" ? (
        <Slideshow
          slides={slides}
          onViewFull={() => setMode("full")}
          initialIndex={0}
        />
      ) : (
        <FullResults
          assessment={assessment}
          onBackToSlideshow={() => setMode("slideshow")}
        />
      )}
    </div>
  );
}
