"use client";

type Props = { onBegin: () => void };

export function IntroView({ onBegin }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "calc(100vh - 80px)",
        padding: "32px 24px",
      }}
    >
      <span className="label" style={{ marginBottom: 18 }}>Know Thyself</span>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(36px, 6vw, 56px)",
          lineHeight: 1.1,
          margin: "0 0 22px",
        }}
      >
        A conversation that reveals how you think.
      </h1>
      <p style={{ fontSize: 17, maxWidth: 540, margin: "0 0 36px", color: "var(--color-ink)" }}>
        Answer 15–20 questions naturally, the way you would in a real conversation. It takes about ten minutes. Your responses are not stored.
      </p>
      <button
        onClick={onBegin}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          fontWeight: 600,
          background: "var(--color-ink)",
          color: "var(--color-bg)",
          border: "none",
          padding: "14px 32px",
          cursor: "pointer",
        }}
      >
        Begin
      </button>
    </div>
  );
}
