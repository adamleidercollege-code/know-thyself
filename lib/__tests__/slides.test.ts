import { describe, it, expect } from "vitest";
import { buildSlideList, type Slide } from "../slides";
import type { Assessment } from "../schema";
import { METRIC_NAMES } from "../schema";

function fixture(suggestionCount: number): Assessment {
  return {
    metrics: METRIC_NAMES.map((name) => ({
      name, score: 3, summary: "s", detail: "d", interactions: [],
    })),
    strengths: ["a"],
    areas_for_growth: ["b"],
    interactions: [{ metrics: ["Anxiety", "Attentional Control"], description: "d" }],
    suggestions: Array.from({ length: suggestionCount }, (_, i) => ({
      title: `t${i}`, summary: `s${i}`, detail: `d${i}`,
    })),
    profile_type: "x",
    profile_description: "y",
  };
}

describe("buildSlideList", () => {
  it("produces 9 slides for 3 suggestions", () => {
    expect(buildSlideList(fixture(3))).toHaveLength(9);
  });

  it("produces 11 slides for 5 suggestions", () => {
    expect(buildSlideList(fixture(5))).toHaveLength(11);
  });

  it("orders slides correctly", () => {
    const slides = buildSlideList(fixture(4));
    const kinds = slides.map((s) => s.kind);
    expect(kinds).toEqual([
      "profile",
      "strengths_growth",
      "suggestion", "suggestion", "suggestion", "suggestion",
      "metrics", "metrics",
      "interactions",
      "fin",
    ]);
  });

  it("metrics slides split into halves of 4", () => {
    const slides = buildSlideList(fixture(3));
    const metrics = slides.filter((s): s is Extract<Slide, { kind: "metrics" }> => s.kind === "metrics");
    expect(metrics).toHaveLength(2);
    expect(metrics[0].metrics).toHaveLength(4);
    expect(metrics[1].metrics).toHaveLength(4);
    expect(metrics[0].part).toBe(1);
    expect(metrics[1].part).toBe(2);
  });

  it("each suggestion slide carries its index", () => {
    const slides = buildSlideList(fixture(4));
    const suggestions = slides.filter((s): s is Extract<Slide, { kind: "suggestion" }> => s.kind === "suggestion");
    expect(suggestions.map((s) => s.index)).toEqual([0, 1, 2, 3]);
  });
});
