import type { Suggestion } from "@/lib/schema";
import { SuggestionCard } from "@/components/results/parts/SuggestionCard";

type Props = { index: number; total: number; suggestion: Suggestion };

export function SuggestionSlide({ index, total, suggestion }: Props) {
  return (
    <div style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
      <div className="label" style={{ textAlign: "center", marginBottom: 32 }}>
        Suggestion {index + 1} of {total}
      </div>
      <SuggestionCard index={index} suggestion={suggestion} alwaysOpen />
    </div>
  );
}
