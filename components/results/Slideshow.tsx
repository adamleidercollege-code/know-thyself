"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Slide } from "@/lib/slides";
import { ProfileSlide } from "./slides/ProfileSlide";
import { StrengthsGrowthSlide } from "./slides/StrengthsGrowthSlide";
import { SuggestionSlide } from "./slides/SuggestionSlide";
import { MetricsSlide } from "./slides/MetricsSlide";
import { InteractionsSlide } from "./slides/InteractionsSlide";
import { FinSlide } from "./slides/FinSlide";

type Props = {
  slides: Slide[];
  onViewFull: () => void;
  initialIndex?: number;
};

export function Slideshow({ slides, onViewFull, initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const total = slides.length;

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setDirection(1);
      return i + 1;
    });
  }, [total]);

  const back = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      setDirection(-1);
      return i - 1;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT") return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  const current = slides[index];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 80px)" }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={{
            enter: (d: 1 | -1) => ({ opacity: 0, x: d * 12 }),
            center: { opacity: 1, x: 0 },
            exit: (d: 1 | -1) => ({ opacity: 0, x: -d * 12 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <SlideRender slide={current} onViewFull={onViewFull} />
        </motion.div>
      </AnimatePresence>

      {!isFirst && <NavArrow direction="left" onClick={back} />}
      {!isLast && <NavArrow direction="right" onClick={advance} />}

      <div
        style={{
          position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
          fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: ".22em",
          textTransform: "uppercase", color: "var(--color-muted)", fontWeight: 600,
          zIndex: 30,
        }}
      >
        {index + 1} / {total}
      </div>
    </div>
  );
}

function NavArrow({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Previous slide" : "Next slide"}
      style={{
        position: "fixed", top: "50%", transform: "translateY(-50%)",
        [direction]: 18,
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid var(--color-ink)",
        background: "rgba(250,248,243,.85)",
        color: "var(--color-ink)",
        fontFamily: "var(--font-sans)", fontSize: 16,
        cursor: "pointer", opacity: 0.55,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 30,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
    >
      {direction === "left" ? "←" : "→"}
    </button>
  );
}

function SlideRender({ slide, onViewFull }: { slide: Slide; onViewFull: () => void }) {
  switch (slide.kind) {
    case "profile":
      return <ProfileSlide profileType={slide.profile_type} profileDescription={slide.profile_description} />;
    case "strengths_growth":
      return <StrengthsGrowthSlide strengths={slide.strengths} areasForGrowth={slide.areas_for_growth} />;
    case "suggestion":
      return <SuggestionSlide index={slide.index} total={slide.total} suggestion={slide.suggestion} />;
    case "metrics":
      return <MetricsSlide part={slide.part} metrics={slide.metrics} />;
    case "interactions":
      return <InteractionsSlide interactions={slide.interactions} />;
    case "fin":
      return <FinSlide onViewFull={onViewFull} />;
  }
}
