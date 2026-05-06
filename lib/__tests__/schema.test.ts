import { describe, it, expect } from "vitest";
import { AssessmentSchema, METRIC_NAMES } from "../schema";

const validJson = {
  metrics: METRIC_NAMES.map((name) => ({
    name,
    score: 3,
    summary: "summary text",
    detail: "detail text",
    interactions: [],
  })),
  strengths: ["a strength"],
  areas_for_growth: ["a growth area"],
  interactions: [
    { metrics: ["Anxiety", "Attentional Control"], description: "they connect" },
  ],
  suggestions: [
    { title: "t1", summary: "s1", detail: "d1" },
    { title: "t2", summary: "s2", detail: "d2" },
    { title: "t3", summary: "s3", detail: "d3" },
  ],
  profile_type: "Type A",
  profile_description: "description",
};

describe("AssessmentSchema", () => {
  it("accepts a valid assessment", () => {
    expect(() => AssessmentSchema.parse(validJson)).not.toThrow();
  });

  it("rejects invalid metric name", () => {
    const bad = structuredClone(validJson);
    (bad.metrics[0] as { name: string }).name = "Made-up Metric";
    expect(() => AssessmentSchema.parse(bad)).toThrow();
  });

  it("rejects score 0 and score 6", () => {
    for (const score of [0, 6]) {
      const bad = structuredClone(validJson);
      bad.metrics[0].score = score;
      expect(() => AssessmentSchema.parse(bad)).toThrow();
    }
  });

  it("rejects fewer than 3 suggestions", () => {
    const bad = structuredClone(validJson);
    bad.suggestions = bad.suggestions.slice(0, 2);
    expect(() => AssessmentSchema.parse(bad)).toThrow();
  });

  it("rejects more than 5 suggestions", () => {
    const bad = structuredClone(validJson);
    bad.suggestions = [...bad.suggestions, ...bad.suggestions];
    expect(() => AssessmentSchema.parse(bad)).toThrow();
  });

  it("rejects fewer than 8 metrics", () => {
    const bad = structuredClone(validJson);
    bad.metrics = bad.metrics.slice(0, 7);
    expect(() => AssessmentSchema.parse(bad)).toThrow();
  });

  it("rejects interaction with wrong number of metrics", () => {
    const bad = structuredClone(validJson);
    bad.interactions[0].metrics = ["Anxiety"];
    expect(() => AssessmentSchema.parse(bad)).toThrow();
  });
});
