type Props = { onViewFull: () => void };

export function FinSlide({ onViewFull }: Props) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center",
        minHeight: "60vh", padding: "32px 24px",
      }}
    >
      <span className="label" style={{ marginBottom: 12 }}>Fin</span>
      <p
        style={{
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          fontSize: 26, margin: "0 0 32px",
        }}
      >
        That&apos;s your profile.
      </p>
      <button
        onClick={onViewFull}
        style={{
          fontFamily: "var(--font-sans)", fontSize: 13,
          letterSpacing: ".18em", textTransform: "uppercase",
          fontWeight: 600,
          background: "var(--color-ink)", color: "var(--color-bg)",
          border: "none", padding: "14px 28px", cursor: "pointer",
        }}
      >
        View Full Results →
      </button>
      <div className="label" style={{ color: "var(--color-muted)", marginTop: 18, fontSize: 11 }}>
        … or use ← to revisit any slide.
      </div>
    </div>
  );
}
