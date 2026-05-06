import type { Interaction } from "@/lib/schema";

type Props = { interaction: Interaction; isFirst?: boolean };

export function InteractionItem({ interaction, isFirst }: Props) {
  return (
    <div
      style={{
        padding: "22px 0",
        borderTop: isFirst ? "none" : "1px solid var(--color-rule-soft)",
      }}
    >
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19, marginBottom: 8 }}>
        {interaction.metrics[0]} <span style={{ color: "var(--color-accent)", padding: "0 6px" }}>—</span> {interaction.metrics[1]}
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--color-ink)" }}>
        {interaction.description}
      </p>
    </div>
  );
}
