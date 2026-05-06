import { HangingNumberList } from "@/components/results/parts/HangingNumberList";

type Props = { strengths: string[]; areasForGrowth: string[] };

export function StrengthsGrowthSlide({ strengths, areasForGrowth }: Props) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div className="kt-twocol" style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: "0 36px" }}>
        <div>
          <div className="label" style={{ marginBottom: 18 }}>Strengths</div>
          <HangingNumberList items={strengths} />
        </div>
        <div style={{ background: "var(--color-rule)" }} />
        <div>
          <div className="label" style={{ marginBottom: 18 }}>Areas for Growth</div>
          <HangingNumberList items={areasForGrowth} />
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .kt-twocol { grid-template-columns: 1fr !important; gap: 32px !important; }
          .kt-twocol > div:nth-child(2) { display: none; }
        }
      `}</style>
    </div>
  );
}
