import type { Metric } from "@/lib/schema";
import { MetricCard } from "@/components/results/parts/MetricCard";

type Props = { part: 1 | 2; metrics: Metric[] };

export function MetricsSlide({ part, metrics }: Props) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div className="label" style={{ marginBottom: 18 }}>
        The Eight Metrics — Part {part === 1 ? "One" : "Two"}
      </div>
      <div className="kt-mgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
        {metrics.map((m) => <MetricCard key={m.name} metric={m} />)}
      </div>
      <style>{`
        @media (max-width: 720px) {
          .kt-mgrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
