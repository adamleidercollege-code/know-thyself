import type { Interaction } from "@/lib/schema";
import { InteractionItem } from "@/components/results/parts/InteractionItem";

type Props = { interactions: Interaction[] };

export function InteractionsSlide({ interactions }: Props) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 720, margin: "0 auto" }}>
      <div className="label" style={{ marginBottom: 18 }}>How These Connect</div>
      {interactions.map((it, i) => (
        <InteractionItem key={i} interaction={it} isFirst={i === 0} />
      ))}
    </div>
  );
}
