import { ProfileHero } from "@/components/results/parts/ProfileHero";

type Props = { profileType: string; profileDescription: string };

export function ProfileSlide({ profileType, profileDescription }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 24px" }}>
      <ProfileHero profileType={profileType} profileDescription={profileDescription} />
    </div>
  );
}
