type Props = {
  items: string[];
};

export function HangingNumberList({ items }: Props) {
  return (
    <ol style={{ padding: 0, margin: 0, listStyle: "none" }}>
      {items.map((text, i) => (
        <li
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr",
            gap: 16,
            padding: "18px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--color-rule-soft)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--color-accent)",
              fontSize: 22,
              lineHeight: 1.2,
            }}
          >
            {i + 1}
          </span>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>{text}</p>
        </li>
      ))}
    </ol>
  );
}
