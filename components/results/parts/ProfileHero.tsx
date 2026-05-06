type Props = {
  profileType: string;
  profileDescription: string;
  centered?: boolean;
};

export function ProfileHero({ profileType, profileDescription, centered = true }: Props) {
  return (
    <div style={{ textAlign: centered ? "center" : "left" }}>
      <span className="label">Profile</span>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(36px, 6vw, 56px)",
          lineHeight: 1.1,
          margin: "16px 0 22px",
        }}
      >
        {profileType}
      </h1>
      <p
        style={{
          fontSize: 17,
          maxWidth: centered ? 560 : "none",
          margin: centered ? "0 auto" : 0,
          lineHeight: 1.6,
        }}
      >
        {profileDescription}
      </p>
    </div>
  );
}
