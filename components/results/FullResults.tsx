"use client";

import type { Assessment } from "@/lib/schema";
import { ProfileHero } from "./parts/ProfileHero";
import { HangingNumberList } from "./parts/HangingNumberList";
import { MetricCard } from "./parts/MetricCard";
import { SuggestionCard } from "./parts/SuggestionCard";
import { InteractionItem } from "./parts/InteractionItem";

type Props = {
  assessment: Assessment;
  onBackToSlideshow: () => void;
};

export function FullResults({ assessment, onBackToSlideshow }: Props) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={onBackToSlideshow}
          className="label"
          style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer", padding: 0 }}
        >
          ← Back to slideshow
        </button>
      </div>

      <ProfileHero profileType={assessment.profile_type} profileDescription={assessment.profile_description} centered={false} />

      <hr style={{ border: 0, borderTop: "1px solid var(--color-rule)", margin: "56px 0" }} />

      <Section label="Strengths">
        <HangingNumberList items={assessment.strengths} />
      </Section>

      <Section label="Areas for Growth">
        <HangingNumberList items={assessment.areas_for_growth} />
      </Section>

      <Section label="Suggestions">
        {assessment.suggestions.map((s, i) => (
          <SuggestionCard key={i} index={i} suggestion={s} />
        ))}
      </Section>

      <Section label="The Eight Metrics">
        <div className="kt-mgrid-full" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
          {assessment.metrics.map((m) => <MetricCard key={m.name} metric={m} />)}
        </div>
        <style>{`@media (max-width: 720px) { .kt-mgrid-full { grid-template-columns: 1fr !important; } }`}</style>
      </Section>

      <Section label="How These Connect">
        {assessment.interactions.map((it, i) => (
          <InteractionItem key={i} interaction={it} isFirst={i === 0} />
        ))}
      </Section>

      <div style={{ textAlign: "center", marginTop: 48 }} className="kt-print-button">
        <button
          onClick={() => window.print()}
          className="label"
          style={{
            background: "none", border: "1px solid var(--color-accent)",
            padding: "10px 20px", cursor: "pointer", color: "var(--color-accent)",
          }}
        >
          Print results
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div className="label" style={{ marginBottom: 28 }}>{label}</div>
      {children}
    </section>
  );
}
