import { METRIC_NAMES } from "./schema";

/**
 * Tool definition mirroring AssessmentSchema. The chat model calls this when
 * it has finished questioning; the judge model uses an analogous tool to
 * return the corrected JSON.
 */
export const ASSESSMENT_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    metrics: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          name: { type: "string", enum: [...METRIC_NAMES] },
          score: { type: "integer", minimum: 1, maximum: 5 },
          summary: { type: "string" },
          detail: { type: "string" },
          interactions: {
            type: "array",
            items: { type: "string", enum: [...METRIC_NAMES] },
          },
        },
        required: ["name", "score", "summary", "detail", "interactions"],
      },
    },
    strengths: { type: "array", items: { type: "string" }, minItems: 1 },
    areas_for_growth: { type: "array", items: { type: "string" }, minItems: 1 },
    interactions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          metrics: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { type: "string", enum: [...METRIC_NAMES] },
          },
          description: { type: "string" },
        },
        required: ["metrics", "description"],
      },
    },
    suggestions: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          detail: { type: "string" },
        },
        required: ["title", "summary", "detail"],
      },
    },
    profile_type: { type: "string" },
    profile_description: { type: "string" },
  },
  required: [
    "metrics",
    "strengths",
    "areas_for_growth",
    "interactions",
    "suggestions",
    "profile_type",
    "profile_description",
  ],
};

export const SUBMIT_ASSESSMENT_TOOL = {
  name: "submit_assessment",
  description:
    "Call this tool exactly once at the end of the conversation with the complete assessment JSON. Do not produce any prose after calling this tool.",
  input_schema: ASSESSMENT_INPUT_SCHEMA,
};

export const RETURN_CORRECTED_ASSESSMENT_TOOL = {
  name: "return_corrected_assessment",
  description:
    "Return the corrected assessment JSON in the same shape as the input. Do not include any commentary.",
  input_schema: ASSESSMENT_INPUT_SCHEMA,
};
