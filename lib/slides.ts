import type { Assessment, Metric, Suggestion, Interaction } from "./schema";

export type Slide =
  | { kind: "profile"; profile_type: string; profile_description: string }
  | { kind: "strengths_growth"; strengths: string[]; areas_for_growth: string[] }
  | { kind: "suggestion"; index: number; total: number; suggestion: Suggestion }
  | { kind: "metrics"; part: 1 | 2; metrics: Metric[] }
  | { kind: "interactions"; interactions: Interaction[] }
  | { kind: "fin" };

export function buildSlideList(a: Assessment): Slide[] {
  const slides: Slide[] = [];
  slides.push({
    kind: "profile",
    profile_type: a.profile_type,
    profile_description: a.profile_description,
  });
  slides.push({
    kind: "strengths_growth",
    strengths: a.strengths,
    areas_for_growth: a.areas_for_growth,
  });
  a.suggestions.forEach((suggestion, index) => {
    slides.push({ kind: "suggestion", index, total: a.suggestions.length, suggestion });
  });
  slides.push({ kind: "metrics", part: 1, metrics: a.metrics.slice(0, 4) });
  slides.push({ kind: "metrics", part: 2, metrics: a.metrics.slice(4, 8) });
  slides.push({ kind: "interactions", interactions: a.interactions });
  slides.push({ kind: "fin" });
  return slides;
}
