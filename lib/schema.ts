import { z } from "zod";

export const METRIC_NAMES = [
  "Locus of Control",
  "Self-Efficacy",
  "Growth Mindset",
  "Anxiety",
  "Emotional Regulation",
  "Executive Function",
  "Attentional Control",
  "Metacognition",
] as const;

export type MetricName = (typeof METRIC_NAMES)[number];

const MetricNameSchema = z.enum(METRIC_NAMES);

export const MetricSchema = z.object({
  name: MetricNameSchema,
  score: z.number().int().min(1).max(5),
  summary: z.string().min(1),
  detail: z.string().min(1),
  interactions: z.array(MetricNameSchema),
});

export const InteractionSchema = z.object({
  metrics: z.array(MetricNameSchema).length(2),
  description: z.string().min(1),
});

export const SuggestionSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  detail: z.string().min(1),
});

export const AssessmentSchema = z.object({
  metrics: z.array(MetricSchema).length(8),
  strengths: z.array(z.string().min(1)).min(1),
  areas_for_growth: z.array(z.string().min(1)).min(1),
  interactions: z.array(InteractionSchema).min(1),
  suggestions: z.array(SuggestionSchema).min(3).max(5),
  profile_type: z.string().min(1),
  profile_description: z.string().min(1),
});

export type Metric = z.infer<typeof MetricSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
