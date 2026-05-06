# Know Thyself Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable Next.js app where a college student converses with Claude across 8 psychological metrics, then reviews their results in an Editorial-styled slideshow with a single-scroll fallback view.

**Architecture:** Next.js 15 App Router with two server-only API routes (`/api/chat` streaming + `/api/judge` forced-tool-call). State machine on the client: `intro → chat → judging → slideshow → fullResults`. No DB, no auth, no persistence. Anthropic SDK direct, prompt caching on the system prompt, Zod validation on returned JSON, Framer Motion for slide transitions.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `@anthropic-ai/sdk`, `zod`, `framer-motion`, `next/font` (Source Serif Pro + Inter), Vitest + React Testing Library.

**Spec reference:** `docs/superpowers/specs/2026-05-06-know-thyself-design.md`

---

## Task 1: Initialize Next.js project + install dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.example`, `.eslintrc.json`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (Next default scaffolding, will be edited later)

- [ ] **Step 1: Run create-next-app**

```bash
cd /home/adam-leider/code/psych-assessment
# Using the existing dir; pass --yes to skip prompts where possible
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

When prompted about overwriting existing files (gitignore), accept.

- [ ] **Step 2: Verify scaffold runs**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000 and renders the default Next page. Stop the server (Ctrl+C).

- [ ] **Step 3: Install runtime dependencies**

```bash
npm install @anthropic-ai/sdk@^0.40.0 zod framer-motion
```

- [ ] **Step 4: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

- [ ] **Step 5: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 6: Add `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 7: Add test scripts to `package.json`**

Modify `package.json` `scripts` block to include:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 8: Add `.env.example`**

```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 9: Update `.gitignore`** (append if not already present)

Add these lines to `.gitignore`:

```
.env
.env.local
.next/
node_modules/
coverage/
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + dependencies + Vitest"
```

---

## Task 2: Configure fonts and Tailwind theme

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Know Thyself",
  description: "A 10–15 minute conversation that reveals how you think.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

(Source Serif Pro is now `Source_Serif_4` in Google Fonts; same family.)

- [ ] **Step 2: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #faf8f3;
  --color-ink: #1a1a1a;
  --color-accent: #b8541c;
  --color-muted: #6b6357;
  --color-tertiary: #8a8175;
  --color-rule: #ddd6c5;
  --color-rule-soft: #e8e2d2;
  --color-card: #fefcf8;

  --font-serif: var(--font-serif), Georgia, serif;
  --font-sans: var(--font-sans), system-ui, sans-serif;
}

html, body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-feature-settings: "kern" 1, "liga" 1;
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }

.label {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: .22em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-accent);
}

@media print {
  /* Print styles applied in Task 22 */
}
```

- [ ] **Step 3: Verify dev server still renders**

```bash
npm run dev
```

Expected: page renders with the warm off-white background. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "style: configure Editorial palette + fonts"
```

---

## Task 3: Create `lib/config.ts` (model constants)

**Files:**
- Create: `lib/config.ts`

- [ ] **Step 1: Create the file**

```ts
/**
 * Anthropic model selection. Swap CHAT_MODEL to "claude-opus-4-7" for
 * stronger scoring at higher cost.
 */
export const CHAT_MODEL = "claude-sonnet-4-6";
export const JUDGE_MODEL = "claude-sonnet-4-6";

export const CHAT_MAX_TOKENS = 2048;
export const JUDGE_MAX_TOKENS = 4096;
```

- [ ] **Step 2: Commit**

```bash
git add lib/config.ts
git commit -m "feat: model config constants"
```

---

## Task 4: Create `lib/schema.ts` (Zod schema + types)

**Files:**
- Create: `lib/schema.ts`
- Create: `lib/__tests__/schema.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/__tests__/schema.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/__tests__/schema.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `lib/schema.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- lib/__tests__/schema.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/schema.ts lib/__tests__/schema.test.ts
git commit -m "feat: Zod schema + types for assessment JSON"
```

---

## Task 5: Create `lib/tool.ts` (submit_assessment tool definition)

**Files:**
- Create: `lib/tool.ts`

- [ ] **Step 1: Create file**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/tool.ts
git commit -m "feat: Anthropic tool definitions"
```

---

## Task 6: Create the three prompt files

**Files:**
- Create: `lib/prompts/system.ts`
- Create: `lib/prompts/judge.ts`
- Create: `lib/prompts/footer-copy.ts`

The system prompt is large. The exact text comes from the user's spec input — copy it verbatim into the file. The §11 addition (about not shying away from 1s and 5s) goes into the **Scoring System** section, directly after the confidence-check paragraph.

- [ ] **Step 1: Create `lib/prompts/system.ts`**

```ts
/**
 * Full system prompt for the chat (assessment) model.
 * Server-only — never sent to the client.
 *
 * SOURCE: User-supplied. Includes §11 spec addition about decisive scoring.
 */
export const SYSTEM_PROMPT = `SECTION 1 — OPENING

You are a psychological assessment tool conducting a structured but conversational evaluation of the user's cognitive and psychological profile. Your goal is to build an accurate understanding of how the user thinks, manages themselves, and relates to challenge and difficulty — across eight specific metrics — through a natural, open-ended conversation.
You are professional, curious, and neutral. You do not mirror the user's tone or energy. You do not react emotionally to their answers, offer encouragement, or validate their responses during the assessment. You are genuinely interested in what they say but your demeanor remains steady and consistent regardless of who you are talking to or what they tell you.
You will ask between 15 and 20 questions maximum. 15 is your target. You will never exceed 20. You open directly with your first question — no introduction, no explanation of the process.
You will ask one question at a time and wait for a full response before proceeding. You may ask follow-up questions per metric according to the limits specified in the question bank — avoid them unless necessary and never exceed the designated limit for each metric. You will not ask questions outside of your question bank unless a response genuinely warrants a single spontaneous follow-up.

SECTION TWO — QUESTION BANK
[ENGINEER NOTE: paste the full Question Bank section from the spec/transcript here.
It contains the eight metrics with validated instrument items, conversational
translations, dynamic rewording instructions, and follow-up guidance.
This is the single largest section of the prompt.]

[The Scoring System subsection lives within Section 2 / closing logic of the
prompt. Insert the §11 spec addition here, directly after the confidence-check
paragraph:]

Do not shy away from scores of 1, 2, 4, or 5. A score of 3 should only appear in the final output if genuine uncertainty remains after all questioning for that metric is complete. Strong clear signal in either direction should produce a score of 1-2 or 4-5. Clustering scores around 3 produces a profile that is unhelpfully neutral and fails the user. A person who clearly demonstrates high self-efficacy should receive a 4 or 5. A person who clearly demonstrates poor executive function should receive a 1 or 2. Err toward decisiveness when the evidence supports it.

[End of §11 addition.]

SECTION 3 — SCORING REVIEW AND RELATIONAL UNDERSTANDING
[ENGINEER NOTE: paste this section verbatim from the spec/transcript.]

SECTION FOUR — OUTPUT
[ENGINEER NOTE: paste this section verbatim. The output instruction tells the
model to call the submit_assessment tool with the JSON object as the argument,
NOT to print raw JSON.]
`;
```

**Important**: the engineer must paste the full sections from the spec / brainstorming transcript into the placeholders before the app will work. The section markers above show exactly where each piece goes. The §11 addition is included verbatim and is the only inline content — the rest is structural.

- [ ] **Step 2: Create `lib/prompts/judge.ts`**

```ts
/**
 * Judge prompt — independent reviewer of the chat model's draft JSON.
 * Server-only.
 *
 * SOURCE: User-supplied verbatim.
 */
export const JUDGE_PROMPT = `You are an independent scoring reviewer for a psychological assessment tool. You will receive two inputs: the full conversation transcript between the assessment model and the user, and the JSON output the assessment model produced based on that conversation. Your job is to review the JSON critically and return a corrected version that is more accurate, better supported, and more internally consistent.
What you are evaluating:
Review the JSON against the transcript with the following questions in mind for each metric:
Is the score directionally correct given what the person actually said? A score should be directly traceable to specific things the person said — not inferred loosely or assumed.
Is the score overconfident? If the conversation produced thin or ambiguous signal for a metric, the score should sit closer to 3 and the summary should acknowledge uncertainty rather than stating a confident finding.
Is the qualitative summary specific to this person or could it apply to anyone? Generic summaries that don't reference the person's actual answers should be rewritten.
Are the interactions identified genuinely supported by the scores and the transcript, or are they speculative? Remove or revise interactions that aren't clearly evidenced.
Are the suggestions directly tied to the profile, or are they generic advice that could apply to anyone? Each suggestion should be traceable to a specific finding in this person's scores and notes.
Is the profile type accurate and specific to this person's overall pattern, or does it feel generic?
What you are not doing:
You are not reassessing the person from scratch. You are reviewing the assessment model's work and correcting only what is genuinely wrong, overconfident, or poorly supported. If a score and its summary are well supported by the transcript, leave them exactly as they are. Make the minimum number of changes necessary to produce an accurate and honest profile.
Scoring correction guidelines:
If a score is clearly contradicted by the transcript, correct it and rewrite the affected summary and detail
If a score is directionally right but the margin of confidence is overstated, nudge the score toward 3 and soften the language in the summary accordingly
If a score is well supported and the summary is specific and accurate, do not change it
Never move a score more than one point in either direction unless the transcript directly contradicts the original score
Output:
Call the return_corrected_assessment tool with the corrected JSON in the same structure as the input. Do not include any explanation, commentary, or text outside the tool call.`;
```

- [ ] **Step 3: Create `lib/prompts/footer-copy.ts`**

```ts
export type FooterSection = {
  id: "how" | "sources" | "limitations" | "privacy" | "about" | "feedback";
  title: string;
  body: React.ReactNode;
};

import React from "react";

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    id: "how",
    title: "How It Works",
    body: React.createElement(
      "p",
      null,
      "This tool conducts a structured psychological assessment through natural conversation. As you answer questions, the model privately evaluates your responses across eight validated cognitive and psychological metrics. Each question is drawn from a curated bank grounded in peer-reviewed psychometric research and is selected adaptively based on your previous answers. At the end of the conversation, a second AI model independently reviews the assessment for consistency and accuracy before your results are generated. Your profile reflects patterns in how you think, manage yourself, and relate to challenge — not a clinical diagnosis or a fixed verdict."
    ),
  },
  {
    id: "sources",
    title: "Sources",
    body: React.createElement(React.Fragment, null,
      React.createElement("p", null, "The following peer-reviewed frameworks and instruments informed the design of this assessment:"),
      React.createElement("ul", { className: "sources-list" },
        React.createElement("li", null, "Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. ", React.createElement("em", null, "Psychological Review"), ", 84(2), 191–215."),
        React.createElement("li", null, "Barkley, R.A. (1997). Behavioral inhibition, sustained attention, and executive functions. ", React.createElement("em", null, "Psychological Bulletin"), ", 121(1), 65–94."),
        React.createElement("li", null, "Beck, A.T., Epstein, N., Brown, G., & Steer, R.A. (1988). An inventory for measuring clinical anxiety. ", React.createElement("em", null, "Journal of Consulting and Clinical Psychology"), ", 56(6), 893–897."),
        React.createElement("li", null, "Derryberry, D. & Reed, M.A. (2002). Anxiety-related attentional biases and their regulation by attentional control. ", React.createElement("em", null, "Journal of Abnormal Psychology"), ", 111(2), 225–236."),
        React.createElement("li", null, "Dweck, C.S. (2006). ", React.createElement("em", null, "Mindset: The New Psychology of Success"), ". Random House."),
        React.createElement("li", null, "Dweck, C.S. & Leggett, E.L. (1988). A social-cognitive approach to motivation and personality. ", React.createElement("em", null, "Psychological Review"), ", 95(2), 256–273."),
        React.createElement("li", null, "Flavell, J.H. (1979). Metacognition and cognitive monitoring. ", React.createElement("em", null, "American Psychologist"), ", 34(10), 906–911."),
        React.createElement("li", null, "Gratz, K.L. & Roemer, L. (2004). Multidimensional assessment of emotion regulation and dysregulation. ", React.createElement("em", null, "Journal of Psychopathology and Behavioral Assessment"), ", 26(1), 41–54."),
        React.createElement("li", null, "Gross, J.J. (1998). The emerging field of emotion regulation. ", React.createElement("em", null, "Review of General Psychology"), ", 2(3), 271–299."),
        React.createElement("li", null, "Miyake, A. et al. (2000). The unity and diversity of executive functions. ", React.createElement("em", null, "Cognitive Psychology"), ", 41(1), 49–100."),
        React.createElement("li", null, "Pearlin, L.I. & Schooler, C. (1978). The structure of coping. ", React.createElement("em", null, "Journal of Health and Social Behavior"), ", 19(1), 2–21."),
        React.createElement("li", null, "Pintrich, P.R. & De Groot, E.V. (1990). Motivational and self-regulated learning components of classroom academic performance. ", React.createElement("em", null, "Journal of Educational Psychology"), ", 82(1), 33–40."),
        React.createElement("li", null, "Posner, M.I. & Petersen, S.E. (1990). The attention system of the human brain. ", React.createElement("em", null, "Annual Review of Neuroscience"), ", 13(1), 25–42."),
        React.createElement("li", null, "Rotter, J.B. (1966). Generalized expectancies for internal versus external control of reinforcement. ", React.createElement("em", null, "Psychological Monographs"), ", 80(1), 1–28."),
        React.createElement("li", null, "Schraw, G. & Dennison, R.S. (1994). Assessing metacognitive awareness. ", React.createElement("em", null, "Contemporary Educational Psychology"), ", 19(4), 460–475."),
        React.createElement("li", null, "Spielberger, C.D., Gorsuch, R.L., & Lushene, R.E. (1970). ", React.createElement("em", null, "Manual for the State-Trait Anxiety Inventory"), ". Consulting Psychologists Press."),
      ),
    ),
  },
  {
    id: "limitations",
    title: "Limitations",
    body: React.createElement(
      "p",
      null,
      "This assessment is designed for self-reflection and educational purposes only. It is not a clinical psychological evaluation and should not be interpreted as a diagnosis or a substitute for professional mental health support. Results are generated by an AI model based on self-reported responses and are subject to the limitations of both language models and self-report methodology. Scores represent patterns observed in a single conversation and may not fully capture the complexity of your cognitive and psychological profile."
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: React.createElement(
      "p",
      null,
      "This tool does not store, log, or share your conversation or results. Everything happens in your browser — when you close this tab, all data is gone. No account is required and no personally identifiable information is collected. Your responses are sent to Anthropic's API solely for the purpose of generating your assessment and are subject to Anthropic's privacy policy."
    ),
  },
  {
    id: "about",
    title: "About",
    body: React.createElement(
      "p",
      null,
      "Know Thyself is a research project exploring how artificial intelligence can be used to assess cognitive and psychological patterns through adaptive conversation. It was developed as part of an undergraduate senior project and is intended as a proof of concept rather than a production mental health tool. If you have feedback on your experience or the accuracy of your results, please use the link below."
    ),
  },
  {
    id: "feedback",
    title: "Feedback",
    body: React.createElement(React.Fragment, null,
      React.createElement("p", null, "Did your results feel accurate? Was there anything that felt off or missing? Your feedback helps improve the assessment."),
      React.createElement("p", null,
        "Share your feedback → ",
        React.createElement("a", { href: "#", className: "feedback-link" }, "(Google Form link to be provided)")
      ),
    ),
  },
];
```

The Feedback section's `href="#"` is a placeholder — replace when the user provides the Google Form URL.

- [ ] **Step 4: Commit**

```bash
git add lib/prompts/
git commit -m "feat: system prompt scaffold + judge prompt + footer copy

System prompt has placeholder markers for the user's full Question Bank,
Scoring Review, and Output sections — paste-in required before the app
runs end-to-end."
```

---

## Task 7: Slide-list builder utility (pure function, TDD)

**Files:**
- Create: `lib/slides.ts`
- Create: `lib/__tests__/slides.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/__tests__/slides.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/slides.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- lib/__tests__/slides.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/slides.ts lib/__tests__/slides.test.ts
git commit -m "feat: slide list builder + tests"
```

---

## Task 8: `/api/chat` route — streaming with tool use

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `app/api/chat/__tests__/route.test.ts`

The route forwards Anthropic's stream events to the client as Server-Sent Events. The client side will parse these events to populate the chat thread and detect the `submit_assessment` tool call.

- [ ] **Step 1: Write the failing test**

`app/api/chat/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        stream: vi.fn().mockImplementation(async function* () {
          yield { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } };
          yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hello" } };
          yield { type: "content_block_stop", index: 0 };
          yield { type: "message_stop" };
        }),
      },
    })),
  };
});

describe("/api/chat", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns SSE stream", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("streams events as SSE data lines", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain("data: ");
    expect(text).toContain("text_delta");
    expect(text).toContain("Hello");
  });

  it("rejects non-array messages with 400", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: "oops" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- app/api/chat
```

Expected: module not found.

- [ ] **Step 3: Implement `app/api/chat/route.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { CHAT_MODEL, CHAT_MAX_TOKENS } from "@/lib/config";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { SUBMIT_ASSESSMENT_TOOL } from "@/lib/tool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }
  if (!Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: "messages must be an array" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }
  const messages = body.messages as ChatMessage[];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: CHAT_MODEL,
    max_tokens: CHAT_MAX_TOKENS,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [SUBMIT_ASSESSMENT_TOOL],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const sse = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- app/api/chat
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat
git commit -m "feat: /api/chat SSE proxy to Anthropic with tool definition"
```

---

## Task 9: `/api/judge` route — forced tool call + retry

**Files:**
- Create: `app/api/judge/route.ts`
- Create: `app/api/judge/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { METRIC_NAMES } from "@/lib/schema";

const validJson = {
  metrics: METRIC_NAMES.map((name) => ({ name, score: 3, summary: "s", detail: "d", interactions: [] })),
  strengths: ["a"],
  areas_for_growth: ["b"],
  interactions: [{ metrics: ["Anxiety", "Attentional Control"], description: "x" }],
  suggestions: [
    { title: "t1", summary: "s1", detail: "d1" },
    { title: "t2", summary: "s2", detail: "d2" },
    { title: "t3", summary: "s3", detail: "d3" },
  ],
  profile_type: "p",
  profile_description: "q",
};

const createMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
}));

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  createMock.mockReset();
});

describe("/api/judge", () => {
  it("returns corrected JSON on first success", async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: "tool_use", name: "return_corrected_assessment", input: validJson }],
    });
    const req = new Request("http://localhost/api/judge", {
      method: "POST",
      body: JSON.stringify({ transcript: [], draftJson: validJson }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.correctedJson).toBeDefined();
  });

  it("falls back to draft on second validation failure", async () => {
    const bad = { ...validJson, metrics: [] };
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "return_corrected_assessment", input: bad }],
    });
    const req = new Request("http://localhost/api/judge", {
      method: "POST",
      body: JSON.stringify({ transcript: [], draftJson: validJson }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.draftFallback).toBe(true);
    expect(data.correctedJson).toEqual(validJson);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- app/api/judge
```

- [ ] **Step 3: Implement `app/api/judge/route.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { JUDGE_MODEL, JUDGE_MAX_TOKENS } from "@/lib/config";
import { JUDGE_PROMPT } from "@/lib/prompts/judge";
import { RETURN_CORRECTED_ASSESSMENT_TOOL } from "@/lib/tool";
import { AssessmentSchema } from "@/lib/schema";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: { transcript?: unknown; draftJson?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.transcript) || !body.draftJson) {
    return Response.json({ error: "transcript and draftJson required" }, { status: 400 });
  }
  const transcript = body.transcript as ChatMessage[];
  const draftJson = body.draftJson;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userText = [
    "Conversation transcript (JSON array of messages):",
    JSON.stringify(transcript, null, 2),
    "",
    "Draft JSON to review:",
    JSON.stringify(draftJson, null, 2),
  ].join("\n");

  async function callJudge(extraInstruction?: string) {
    const systemBlocks = [{ type: "text" as const, text: JUDGE_PROMPT }];
    const userContent = extraInstruction
      ? `${userText}\n\nNote: your previous response did not match the schema (${extraInstruction}). Try again.`
      : userText;
    return client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: JUDGE_MAX_TOKENS,
      system: systemBlocks,
      tools: [RETURN_CORRECTED_ASSESSMENT_TOOL],
      tool_choice: { type: "tool", name: "return_corrected_assessment" },
      messages: [{ role: "user", content: userContent }],
    });
  }

  function extractToolInput(response: Anthropic.Message): unknown {
    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "return_corrected_assessment") {
        return block.input;
      }
    }
    return null;
  }

  try {
    let response = await callJudge();
    let input = extractToolInput(response);
    let parsed = AssessmentSchema.safeParse(input);
    if (!parsed.success) {
      response = await callJudge(parsed.error.message);
      input = extractToolInput(response);
      parsed = AssessmentSchema.safeParse(input);
    }
    if (!parsed.success) {
      return Response.json({ correctedJson: draftJson, draftFallback: true });
    }
    return Response.json({ correctedJson: parsed.data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return Response.json(
      { correctedJson: draftJson, draftFallback: true, error: msg },
      { status: 200 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- app/api/judge
```

- [ ] **Step 5: Commit**

```bash
git add app/api/judge
git commit -m "feat: /api/judge with forced tool call, retry, and graceful fallback"
```

---

## Task 10: Footer component (panel + container)

**Files:**
- Create: `components/footer/Footer.tsx`
- Create: `components/footer/FooterPanel.tsx`
- Create: `components/footer/Footer.module.css`

- [ ] **Step 1: Create `components/footer/FooterPanel.tsx`**

```tsx
"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  body: React.ReactNode;
  onClose: () => void;
};

export function FooterPanel({ title, body, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={title}
      style={{
        position: "fixed",
        left: 0, right: 0, bottom: 0,
        height: "min(60vh, 600px)",
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-rule)",
        boxShadow: "0 -8px 32px rgba(0,0,0,.08)",
        zIndex: 50,
        overflow: "auto",
        padding: "32px 32px 64px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            float: "right",
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--color-accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close ✕
        </button>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: 28,
            margin: "0 0 18px",
            color: "var(--color-ink)",
          }}
        >
          {title}
        </h2>
        <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--color-ink)" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/footer/Footer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { FOOTER_SECTIONS } from "@/lib/prompts/footer-copy";
import { FooterPanel } from "./FooterPanel";

export function Footer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = FOOTER_SECTIONS.find((s) => s.id === openId);

  return (
    <>
      <footer
        className="kt-footer-bar"
        style={{
          position: "sticky",
          bottom: 0,
          borderTop: "1px solid var(--color-rule)",
          background: "var(--color-bg)",
          padding: "14px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px 24px",
          justifyContent: "center",
          zIndex: 40,
        }}
      >
        {FOOTER_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenId(s.id)}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--color-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {s.title}
          </button>
        ))}
      </footer>
      {open && (
        <FooterPanel title={open.title} body={open.body} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
```

- [ ] **Step 3: Run dev server and visually verify**

```bash
npm run dev
```

Open http://localhost:3000 — at this point the Footer isn't yet wired into a page. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/footer/
git commit -m "feat: persistent footer with six expandable panels"
```

---

## Task 11: IntroView

**Files:**
- Create: `components/intro/IntroView.tsx`

- [ ] **Step 1: Create `components/intro/IntroView.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/intro/
git commit -m "feat: IntroView landing screen"
```

---

## Task 12: Composer + MessageList

**Files:**
- Create: `components/chat/Composer.tsx`
- Create: `components/chat/MessageList.tsx`
- Create: `components/chat/types.ts`

- [ ] **Step 1: Create `components/chat/types.ts`**

```ts
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
```

- [ ] **Step 2: Create `components/chat/MessageList.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";

type Props = {
  messages: ChatMessage[];
  pending?: string;
  showTypingIndicator?: boolean;
};

export function MessageList({ messages, pending, showTypingIndicator }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, showTypingIndicator]);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {messages.map((m, i) => (
        <Bubble key={i} role={m.role} content={m.content} />
      ))}
      {pending !== undefined && <Bubble role="assistant" content={pending} />}
      {showTypingIndicator && messages[messages.length - 1]?.role === "user" && pending === undefined && (
        <div style={{ alignSelf: "flex-start", color: "var(--color-tertiary)", fontStyle: "italic" }}>…</div>
      )}
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        background: isUser ? "var(--color-card)" : "transparent",
        padding: isUser ? "10px 14px" : "0",
        borderRadius: isUser ? 12 : 0,
        border: isUser ? "1px solid var(--color-rule-soft)" : "none",
        fontFamily: "var(--font-serif)",
        fontSize: 16,
        lineHeight: 1.55,
        color: "var(--color-ink)",
        whiteSpace: "pre-wrap",
      }}
    >
      {content}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/chat/Composer.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
};

export function Composer({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-rule-soft)",
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        background: "var(--color-bg)",
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        rows={1}
        placeholder="Type your response…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        style={{
          flex: 1,
          fontFamily: "var(--font-serif)",
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--color-ink)",
          background: "var(--color-card)",
          border: "1px solid var(--color-rule-soft)",
          borderRadius: 12,
          padding: "12px 14px",
          resize: "none",
          maxHeight: 200,
          outline: "none",
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          fontWeight: 600,
          background: disabled ? "var(--color-tertiary)" : "var(--color-ink)",
          color: "var(--color-bg)",
          border: "none",
          borderRadius: 8,
          padding: "12px 18px",
          cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/chat/types.ts components/chat/MessageList.tsx components/chat/Composer.tsx
git commit -m "feat: Composer + MessageList for chat thread"
```

---

## Task 13: `useChatStream` hook + ChatView

**Files:**
- Create: `components/chat/useChatStream.ts`
- Create: `components/chat/ChatView.tsx`

The hook owns the SSE consumer + tool-input accumulator. It exposes turn-level status and the parsed tool input on completion.

- [ ] **Step 1: Create `components/chat/useChatStream.ts`**

```ts
"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "./types";

type Status = "idle" | "streaming" | "tool_received" | "error";

type ToolPayload = { toolName: string; input: unknown };

export function useChatStream(initial: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [tool, setTool] = useState<ToolPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (userText: string | null) => {
    setError(null);
    setTool(null);
    let nextHistory = messages;
    if (userText !== null) {
      nextHistory = [...messages, { role: "user" as const, content: userText }];
      setMessages(nextHistory);
    }
    setPending("");
    setStatus("streaming");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let assistantText = "";
    let toolInputBuffer = "";
    let toolName: string | null = null;
    let stopReason: string | null = null;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const payload = dataLine.slice(6);
          let evt: { type?: string; delta?: { type?: string; text?: string; partial_json?: string }; content_block?: { type?: string; name?: string }; message?: { stop_reason?: string }; index?: number };
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }
          if (evt.type === "content_block_start" && evt.content_block?.type === "tool_use") {
            toolName = evt.content_block.name ?? null;
            toolInputBuffer = "";
          } else if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            assistantText += evt.delta.text ?? "";
            setPending(assistantText);
          } else if (evt.type === "content_block_delta" && evt.delta?.type === "input_json_delta") {
            toolInputBuffer += evt.delta.partial_json ?? "";
          } else if (evt.type === "message_delta") {
            // capture stop_reason if present
            const sr = (evt as unknown as { delta?: { stop_reason?: string } }).delta?.stop_reason;
            if (sr) stopReason = sr;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "stream error";
      setError(msg);
      setStatus("error");
      setPending(null);
      return;
    }

    if (assistantText) {
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    }
    setPending(null);

    if (stopReason === "tool_use" && toolName) {
      try {
        const input = JSON.parse(toolInputBuffer);
        setTool({ toolName, input });
        setStatus("tool_received");
      } catch (err) {
        setError(err instanceof Error ? err.message : "bad tool JSON");
        setStatus("error");
      }
    } else {
      setStatus("idle");
    }
  }, [messages]);

  const retryLast = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      const trimmed = last?.role === "assistant" ? prev.slice(0, -1) : prev;
      return trimmed;
    });
    void send(null);
  }, [send]);

  return { messages, pending, status, tool, error, send, retryLast };
}
```

- [ ] **Step 2: Create `components/chat/ChatView.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useChatStream } from "./useChatStream";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import type { Assessment } from "@/lib/schema";

type Props = {
  onAssessmentReady: (transcript: { role: "user" | "assistant"; content: string }[], draftJson: Assessment) => void;
};

export function ChatView({ onAssessmentReady }: Props) {
  const { messages, pending, status, tool, error, send, retryLast } = useChatStream();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      void send(null);
    }
  }, [send]);

  useEffect(() => {
    if (status === "tool_received" && tool && tool.toolName === "submit_assessment") {
      onAssessmentReady(messages, tool.input as Assessment);
    }
  }, [status, tool, messages, onAssessmentReady]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <div className="label" style={{ padding: "16px 24px 0" }}>Know Thyself</div>
      <MessageList messages={messages} pending={pending ?? undefined} showTypingIndicator={status === "streaming"} />
      {error ? (
        <div style={{ padding: 16, textAlign: "center" }}>
          <p style={{ color: "var(--color-muted)", marginBottom: 12 }}>{error}</p>
          <button onClick={retryLast} className="label" style={{ background: "none", border: "1px solid var(--color-accent)", padding: "8px 16px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      ) : (
        <Composer disabled={status === "streaming" || status === "tool_received"} onSend={(t) => void send(t)} />
      )}
    </div>
  );
}
```

The `useRef(false)` guard ensures the first chat fetch runs exactly once even though `send` (a `useCallback` whose deps include `messages`) changes after every turn. **StrictMode caveat:** in dev, React 18+ StrictMode mounts components twice. The ref persists across remounts in production but resets in dev's StrictMode double-mount, so the engineer may see two initial fetches in dev only. If this is bothersome during local testing, hoist the ref into module scope (`let started = false; ...`) — module-level state survives StrictMode's dev remount.

- [ ] **Step 3: Commit**

```bash
git add components/chat/useChatStream.ts components/chat/ChatView.tsx
git commit -m "feat: chat stream hook + ChatView with tool detection"
```

---

## Task 14: JudgingView

**Files:**
- Create: `components/judging/JudgingView.tsx`

- [ ] **Step 1: Create `components/judging/JudgingView.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import type { Assessment } from "@/lib/schema";
import type { ChatMessage } from "@/components/chat/types";

type Props = {
  transcript: ChatMessage[];
  draftJson: Assessment;
  onResults: (corrected: Assessment, fellBack: boolean) => void;
};

export function JudgingView({ transcript, draftJson, onResults }: Props) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript, draftJson }),
        });
        const data = await res.json();
        if (cancelled) return;
        onResults(data.correctedJson as Assessment, Boolean(data.draftFallback));
      } catch {
        if (!cancelled) onResults(draftJson, true);
      }
    })();
    return () => { cancelled = true; };
  }, [transcript, draftJson, onResults]);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 80px)", padding: 24, textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          fontSize: 22, color: "var(--color-ink)",
        }}
      >
        Putting your results together…
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/judging/
git commit -m "feat: JudgingView calls /api/judge and forwards corrected JSON"
```

---

## Task 15: HangingNumberList + ProfileHero

**Files:**
- Create: `components/results/parts/HangingNumberList.tsx`
- Create: `components/results/parts/ProfileHero.tsx`

- [ ] **Step 1: Create `components/results/parts/HangingNumberList.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `components/results/parts/ProfileHero.tsx`**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add components/results/parts/HangingNumberList.tsx components/results/parts/ProfileHero.tsx
git commit -m "feat: shared parts — HangingNumberList, ProfileHero"
```

---

## Task 16: MetricCard

**Files:**
- Create: `components/results/parts/MetricCard.tsx`
- Create: `components/results/parts/__tests__/MetricCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MetricCard } from "../MetricCard";
import type { Metric } from "@/lib/schema";

const m: Metric = {
  name: "Self-Efficacy", score: 3, summary: "summary text",
  detail: "detail text", interactions: ["Anxiety"],
};

describe("MetricCard", () => {
  it("renders score and exactly one filled dot at the score position", () => {
    const { container } = render(<MetricCard metric={{ ...m, score: 4 }} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    const dots = container.querySelectorAll("[data-dot]");
    expect(dots).toHaveLength(5);
    const filled = container.querySelectorAll("[data-dot-on]");
    expect(filled).toHaveLength(1);
    expect(dots[3]).toHaveAttribute("data-dot-on");
  });

  it("score 1 fills only the first dot", () => {
    const { container } = render(<MetricCard metric={{ ...m, score: 1 }} />);
    const dots = container.querySelectorAll("[data-dot]");
    expect(dots[0]).toHaveAttribute("data-dot-on");
    expect(dots[4]).not.toHaveAttribute("data-dot-on");
  });

  it("score 5 fills only the last dot", () => {
    const { container } = render(<MetricCard metric={{ ...m, score: 5 }} />);
    const dots = container.querySelectorAll("[data-dot]");
    expect(dots[4]).toHaveAttribute("data-dot-on");
    expect(dots[0]).not.toHaveAttribute("data-dot-on");
  });

  it("toggles detail on Read more", async () => {
    render(<MetricCard metric={m} />);
    expect(screen.queryByText("detail text")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /read more/i }));
    expect(screen.getByText("detail text")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failures**

```bash
npm test -- components/results/parts/__tests__/MetricCard.test.tsx
```

- [ ] **Step 3: Create `components/results/parts/MetricCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Metric } from "@/lib/schema";

type Props = { metric: Metric; alwaysOpen?: boolean };

export function MetricCard({ metric, alwaysOpen = false }: Props) {
  const [open, setOpen] = useState(alwaysOpen);
  const showDetail = open || alwaysOpen;
  return (
    <div
      style={{
        borderTop: "1px solid var(--color-rule)",
        padding: "24px 0 22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <span
          style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: 20,
          }}
        >
          {metric.name}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 30, lineHeight: 1 }}>{metric.score}</span>
          <span className="label" style={{ fontSize: 11, color: "var(--color-muted)" }}>/ 5</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            data-dot
            {...(n === metric.score ? { "data-dot-on": true } : {})}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              border: "1px solid var(--color-ink)",
              background: n === metric.score ? "var(--color-ink)" : "transparent",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 14.5, color: "var(--color-ink)", margin: "14px 0 12px", lineHeight: 1.55 }}>
        {metric.summary}
      </p>
      {!alwaysOpen && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="label"
          style={{
            fontSize: 11, fontWeight: 600, color: "var(--color-accent)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          {open ? "Show less ↑" : "Read more ↓"}
        </button>
      )}
      {showDetail && (
        <p style={{ fontSize: 14.5, color: "var(--color-ink)", margin: "12px 0 0", lineHeight: 1.6 }}>
          {metric.detail}
        </p>
      )}
      {metric.interactions.length > 0 && (
        <div
          style={{
            fontFamily: "var(--font-sans)", fontSize: 11,
            color: "var(--color-tertiary)", marginTop: 14,
            letterSpacing: ".04em",
          }}
        >
          Connects with {metric.interactions.join(", ")}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- components/results/parts/__tests__/MetricCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/results/parts/MetricCard.tsx components/results/parts/__tests__/MetricCard.test.tsx
git commit -m "feat: MetricCard with position-based dots + read-more"
```

---

## Task 17: SuggestionCard + InteractionItem

**Files:**
- Create: `components/results/parts/SuggestionCard.tsx`
- Create: `components/results/parts/InteractionItem.tsx`

- [ ] **Step 1: Create `components/results/parts/SuggestionCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/schema";

type Props = {
  index: number;
  suggestion: Suggestion;
  alwaysOpen?: boolean;
};

export function SuggestionCard({ index, suggestion, alwaysOpen = false }: Props) {
  const [open, setOpen] = useState(alwaysOpen);
  const showDetail = open || alwaysOpen;
  return (
    <div
      style={{
        padding: "22px 0",
        borderTop: index === 0 ? "none" : "1px solid var(--color-rule-soft)",
        display: "grid",
        gridTemplateColumns: "36px 1fr",
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          color: "var(--color-accent)", fontSize: 22,
        }}
      >
        {index + 1}
      </span>
      <div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 19, margin: "0 0 4px" }}>
          {suggestion.title}
        </h3>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--color-muted)", margin: "0 0 10px" }}>
          {suggestion.summary}
        </p>
        {!alwaysOpen && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="label"
            style={{ fontSize: 11, color: "var(--color-accent)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {open ? "Show less ↑" : "Read more ↓"}
          </button>
        )}
        {showDetail && (
          <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.65, color: "var(--color-ink)" }}>
            {suggestion.detail}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/results/parts/InteractionItem.tsx`**

```tsx
import type { Interaction } from "@/lib/schema";

type Props = { interaction: Interaction; isFirst?: boolean };

export function InteractionItem({ interaction, isFirst }: Props) {
  return (
    <div
      style={{
        padding: "22px 0",
        borderTop: isFirst ? "none" : "1px solid var(--color-rule-soft)",
      }}
    >
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19, marginBottom: 8 }}>
        {interaction.metrics[0]} <span style={{ color: "var(--color-accent)", padding: "0 6px" }}>—</span> {interaction.metrics[1]}
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--color-ink)" }}>
        {interaction.description}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/results/parts/SuggestionCard.tsx components/results/parts/InteractionItem.tsx
git commit -m "feat: SuggestionCard + InteractionItem"
```

---

## Task 18: Slide components

**Files:**
- Create: `components/results/slides/ProfileSlide.tsx`
- Create: `components/results/slides/StrengthsGrowthSlide.tsx`
- Create: `components/results/slides/SuggestionSlide.tsx`
- Create: `components/results/slides/MetricsSlide.tsx`
- Create: `components/results/slides/InteractionsSlide.tsx`
- Create: `components/results/slides/FinSlide.tsx`

- [ ] **Step 1: Create `ProfileSlide.tsx`**

```tsx
import { ProfileHero } from "@/components/results/parts/ProfileHero";

type Props = { profileType: string; profileDescription: string };

export function ProfileSlide({ profileType, profileDescription }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 24px" }}>
      <ProfileHero profileType={profileType} profileDescription={profileDescription} />
    </div>
  );
}
```

- [ ] **Step 2: Create `StrengthsGrowthSlide.tsx`**

```tsx
import { HangingNumberList } from "@/components/results/parts/HangingNumberList";

type Props = { strengths: string[]; areasForGrowth: string[] };

export function StrengthsGrowthSlide({ strengths, areasForGrowth }: Props) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div className="kt-twocol" style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: "0 36px" }}>
        <div>
          <div className="label" style={{ marginBottom: 18 }}>Strengths</div>
          <HangingNumberList items={strengths} />
        </div>
        <div style={{ background: "var(--color-rule)" }} />
        <div>
          <div className="label" style={{ marginBottom: 18 }}>Areas for Growth</div>
          <HangingNumberList items={areasForGrowth} />
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .kt-twocol { grid-template-columns: 1fr !important; gap: 32px !important; }
          .kt-twocol > div:nth-child(2) { display: none; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 3: Create `SuggestionSlide.tsx`**

```tsx
import type { Suggestion } from "@/lib/schema";
import { SuggestionCard } from "@/components/results/parts/SuggestionCard";

type Props = { index: number; total: number; suggestion: Suggestion };

export function SuggestionSlide({ index, total, suggestion }: Props) {
  return (
    <div style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
      <div className="label" style={{ textAlign: "center", marginBottom: 32 }}>
        Suggestion {index + 1} of {total}
      </div>
      <SuggestionCard index={index} suggestion={suggestion} alwaysOpen />
    </div>
  );
}
```

- [ ] **Step 4: Create `MetricsSlide.tsx`**

```tsx
import type { Metric } from "@/lib/schema";
import { MetricCard } from "@/components/results/parts/MetricCard";

type Props = { part: 1 | 2; metrics: Metric[] };

export function MetricsSlide({ part, metrics }: Props) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div className="label" style={{ marginBottom: 18 }}>
        The Eight Metrics — Part {part === 1 ? "One" : "Two"}
      </div>
      <div className="kt-mgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
        {metrics.map((m) => <MetricCard key={m.name} metric={m} />)}
      </div>
      <style>{`
        @media (max-width: 720px) {
          .kt-mgrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 5: Create `InteractionsSlide.tsx`**

```tsx
import type { Interaction } from "@/lib/schema";
import { InteractionItem } from "@/components/results/parts/InteractionItem";

type Props = { interactions: Interaction[] };

export function InteractionsSlide({ interactions }: Props) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 720, margin: "0 auto" }}>
      <div className="label" style={{ marginBottom: 18 }}>How These Connect</div>
      {interactions.map((it, i) => (
        <InteractionItem key={i} interaction={it} isFirst={i === 0} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `FinSlide.tsx`**

```tsx
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
```

- [ ] **Step 7: Commit**

```bash
git add components/results/slides/
git commit -m "feat: six slide components"
```

---

## Task 19: Slideshow component (Framer Motion + keyboard)

**Files:**
- Create: `components/results/Slideshow.tsx`

- [ ] **Step 1: Create `components/results/Slideshow.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Slide } from "@/lib/slides";
import { ProfileSlide } from "./slides/ProfileSlide";
import { StrengthsGrowthSlide } from "./slides/StrengthsGrowthSlide";
import { SuggestionSlide } from "./slides/SuggestionSlide";
import { MetricsSlide } from "./slides/MetricsSlide";
import { InteractionsSlide } from "./slides/InteractionsSlide";
import { FinSlide } from "./slides/FinSlide";

type Props = {
  slides: Slide[];
  onViewFull: () => void;
  initialIndex?: number;
};

export function Slideshow({ slides, onViewFull, initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const total = slides.length;

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setDirection(1);
      return i + 1;
    });
  }, [total]);

  const back = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      setDirection(-1);
      return i - 1;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT") return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  const current = slides[index];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 80px)" }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={{
            enter: (d: 1 | -1) => ({ opacity: 0, x: d * 12 }),
            center: { opacity: 1, x: 0 },
            exit: (d: 1 | -1) => ({ opacity: 0, x: -d * 12 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <SlideRender slide={current} onViewFull={onViewFull} />
        </motion.div>
      </AnimatePresence>

      {!isFirst && <NavArrow direction="left" onClick={back} />}
      {!isLast && <NavArrow direction="right" onClick={advance} />}

      <div
        style={{
          position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
          fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: ".22em",
          textTransform: "uppercase", color: "var(--color-muted)", fontWeight: 600,
          zIndex: 30,
        }}
      >
        {index + 1} / {total}
      </div>
    </div>
  );
}

function NavArrow({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Previous slide" : "Next slide"}
      style={{
        position: "fixed", top: "50%", transform: "translateY(-50%)",
        [direction]: 18,
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid var(--color-ink)",
        background: "rgba(250,248,243,.85)",
        color: "var(--color-ink)",
        fontFamily: "var(--font-sans)", fontSize: 16,
        cursor: "pointer", opacity: 0.55,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 30,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
    >
      {direction === "left" ? "←" : "→"}
    </button>
  );
}

function SlideRender({ slide, onViewFull }: { slide: Slide; onViewFull: () => void }) {
  switch (slide.kind) {
    case "profile":
      return <ProfileSlide profileType={slide.profile_type} profileDescription={slide.profile_description} />;
    case "strengths_growth":
      return <StrengthsGrowthSlide strengths={slide.strengths} areasForGrowth={slide.areas_for_growth} />;
    case "suggestion":
      return <SuggestionSlide index={slide.index} total={slide.total} suggestion={slide.suggestion} />;
    case "metrics":
      return <MetricsSlide part={slide.part} metrics={slide.metrics} />;
    case "interactions":
      return <InteractionsSlide interactions={slide.interactions} />;
    case "fin":
      return <FinSlide onViewFull={onViewFull} />;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/results/Slideshow.tsx
git commit -m "feat: Slideshow with framer-motion + keyboard navigation"
```

---

## Task 20: FullResults view

**Files:**
- Create: `components/results/FullResults.tsx`

- [ ] **Step 1: Create `components/results/FullResults.tsx`**

```tsx
"use client";

import type { Assessment } from "@/lib/schema";
import { ProfileHero } from "./parts/ProfileHero";
import { HangingNumberList } from "./parts/HangingNumberList";
import { MetricCard } from "./parts/MetricCard";
import { SuggestionCard } from "./parts/SuggestionCard";
import { InteractionItem } from "./parts/InteractionItem";

type Props = {
  assessment: Assessment;
  onBackToSlideshow: () => void;
};

export function FullResults({ assessment, onBackToSlideshow }: Props) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={onBackToSlideshow}
          className="label"
          style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer", padding: 0 }}
        >
          ← Back to slideshow
        </button>
      </div>

      <ProfileHero profileType={assessment.profile_type} profileDescription={assessment.profile_description} centered={false} />

      <hr style={{ border: 0, borderTop: "1px solid var(--color-rule)", margin: "56px 0" }} />

      <Section label="Strengths">
        <HangingNumberList items={assessment.strengths} />
      </Section>

      <Section label="Areas for Growth">
        <HangingNumberList items={assessment.areas_for_growth} />
      </Section>

      <Section label="Suggestions">
        {assessment.suggestions.map((s, i) => (
          <SuggestionCard key={i} index={i} suggestion={s} />
        ))}
      </Section>

      <Section label="The Eight Metrics">
        <div className="kt-mgrid-full" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
          {assessment.metrics.map((m) => <MetricCard key={m.name} metric={m} />)}
        </div>
        <style>{`@media (max-width: 720px) { .kt-mgrid-full { grid-template-columns: 1fr !important; } }`}</style>
      </Section>

      <Section label="How These Connect">
        {assessment.interactions.map((it, i) => (
          <InteractionItem key={i} interaction={it} isFirst={i === 0} />
        ))}
      </Section>

      <div style={{ textAlign: "center", marginTop: 48 }} className="kt-print-button">
        <button
          onClick={() => window.print()}
          className="label"
          style={{
            background: "none", border: "1px solid var(--color-accent)",
            padding: "10px 20px", cursor: "pointer", color: "var(--color-accent)",
          }}
        >
          Print results
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div className="label" style={{ marginBottom: 28 }}>{label}</div>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/results/FullResults.tsx
git commit -m "feat: FullResults single-scroll view"
```

---

## Task 21: ResultsView (mode toggle)

**Files:**
- Create: `components/results/ResultsView.tsx`

- [ ] **Step 1: Create `components/results/ResultsView.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Assessment } from "@/lib/schema";
import { buildSlideList } from "@/lib/slides";
import { Slideshow } from "./Slideshow";
import { FullResults } from "./FullResults";

type Props = {
  assessment: Assessment;
  fellBack: boolean;
};

export function ResultsView({ assessment, fellBack }: Props) {
  const [mode, setMode] = useState<"slideshow" | "full">("slideshow");
  const slides = useMemo(() => buildSlideList(assessment), [assessment]);

  return (
    <div>
      {fellBack && (
        <div
          role="status"
          style={{
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-rule-soft)",
            padding: "8px 16px",
            textAlign: "center",
          }}
        >
          <span className="label" style={{ color: "var(--color-muted)" }}>
            Results displayed without secondary review
          </span>
        </div>
      )}
      {mode === "slideshow" ? (
        <Slideshow
          slides={slides}
          onViewFull={() => setMode("full")}
          initialIndex={0}
        />
      ) : (
        <FullResults
          assessment={assessment}
          onBackToSlideshow={() => setMode("slideshow")}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/results/ResultsView.tsx
git commit -m "feat: ResultsView mode toggle"
```

---

## Task 22: Print stylesheet

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append print rules to `app/globals.css`**

Replace the empty `@media print { ... }` block from Task 2 with:

```css
@media print {
  html, body {
    background: #ffffff !important;
    color: #000000 !important;
  }

  /* Hide nav and footer */
  .kt-footer-bar { display: none !important; }
  [aria-label="Previous slide"], [aria-label="Next slide"] { display: none !important; }
  .kt-print-button { display: none !important; }

  /* Force-expand any collapsed Read more panels by surfacing all paragraphs */
  [aria-expanded="false"] + * { display: block !important; }
  [aria-expanded="false"]::after {
    content: " (expanded for print)";
    font-style: italic;
    color: #666;
    font-size: 10px;
  }

  /* Page-break hints */
  section, .kt-mgrid-full > * { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }

  /* Tighten layout for paper */
  body { font-size: 11pt; line-height: 1.5; }
}
```

The "Read more" force-expand strategy here is conservative — we'll rely on the user's browser to print whatever's currently expanded. For a stronger guarantee, the implementation can take an alternate approach: track an "isPrinting" state, set all `Read more` panels to expanded just before `window.print()`, and reset after the print dialog closes. Implement this as a `usePrint` hook if the simpler CSS approach isn't sufficient during manual QA.

- [ ] **Step 2: Verify in dev**

```bash
npm run dev
```

Open the full-results view (you'll need to run through the app to reach it), trigger Print Preview (Ctrl/Cmd+P), confirm footer is hidden and content is legible. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: print stylesheet for full-results view"
```

---

## Task 23: Wire up state machine in `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { IntroView } from "@/components/intro/IntroView";
import { ChatView } from "@/components/chat/ChatView";
import { JudgingView } from "@/components/judging/JudgingView";
import { ResultsView } from "@/components/results/ResultsView";
import { Footer } from "@/components/footer/Footer";
import type { Assessment } from "@/lib/schema";
import type { ChatMessage } from "@/components/chat/types";

type State =
  | { kind: "intro" }
  | { kind: "chat" }
  | { kind: "judging"; transcript: ChatMessage[]; draftJson: Assessment }
  | { kind: "results"; assessment: Assessment; fellBack: boolean };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "intro" });

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        {state.kind === "intro" && <IntroView onBegin={() => setState({ kind: "chat" })} />}
        {state.kind === "chat" && (
          <ChatView
            onAssessmentReady={(transcript, draftJson) =>
              setState({ kind: "judging", transcript, draftJson })
            }
          />
        )}
        {state.kind === "judging" && (
          <JudgingView
            transcript={state.transcript}
            draftJson={state.draftJson}
            onResults={(assessment, fellBack) => setState({ kind: "results", assessment, fellBack })}
          />
        )}
        {state.kind === "results" && (
          <ResultsView assessment={state.assessment} fellBack={state.fellBack} />
        )}
      </div>
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: builds with no TypeScript or lint errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire state machine — intro→chat→judging→results"
```

---

## Task 24: End-to-end smoke test (manual)

This task does not write code. It verifies the full happy path with real Anthropic calls.

- [ ] **Step 1: Set up local env**

Create `.env.local` (not committed) with:

```
ANTHROPIC_API_KEY=<your real key>
```

Verify the system prompt placeholders in `lib/prompts/system.ts` are filled in with the full Question Bank, Scoring Review, and Output sections from the spec.

- [ ] **Step 2: Run the app and complete one full flow**

```bash
npm run dev
```

- Open http://localhost:3000
- Click "Begin"
- Verify the AI's first message arrives streaming, no introduction text, just the first question
- Answer ~15 questions naturally
- Verify the model closes with a brief neutral statement and transitions to "Putting your results together…"
- Verify the slideshow renders with 9–11 slides depending on suggestion count
- Click through with arrow keys: Right advances, Left goes back, Space advances
- Click "View Full Results" on the Fin slide
- Verify the full-scroll view renders the same content
- Click the "Print results" button and confirm Print Preview hides the footer
- Click "Back to slideshow" and confirm you land on the Fin slide
- Click any footer section and verify the panel slides up; press Escape to close

- [ ] **Step 3: Document any issues found**

Open issues for each. The implementation plan completes here; bug fixes are post-hoc PRs.

- [ ] **Step 4: Final commit (if any docs/notes added)**

```bash
git status
# If clean, no commit. Otherwise:
git add -A
git commit -m "docs: end-to-end smoke test notes"
```

---

## Spec coverage check

| Spec section | Implemented in tasks |
|--------------|---------------------|
| §1–3 Goal, scope, stack | Task 1, 3 |
| §4 State machine + file layout | Task 23 (page.tsx); file layout enforced by paths |
| §5.1 Intro view | Task 11 |
| §5.2 Chat view | Tasks 12–13 |
| §5.3 `/api/chat` | Task 8 |
| §5.4 Tool-use detection | Task 13 (`useChatStream`) |
| §5.5 Judging view | Task 14 |
| §5.6 `/api/judge` | Task 9 |
| §5.7 Slideshow → fullResults | Task 21 (`ResultsView`) |
| §6 JSON schema | Tasks 4–5 |
| §7.1 Foundations (palette, fonts) | Task 2 |
| §7.2 Score visualization | Task 16 (with tests) |
| §7.3 Footer | Task 10 |
| §8 Slideshow | Tasks 18–19 |
| §9 Full Results | Task 20 (+ print in 22) |
| §10 Error handling | Task 8 (chat retry), Task 9 (judge fallback), Task 13 (retryLast) |
| §11 System prompt addition | Task 6 (verbatim, with structural placeholders for the rest of the prompt) |
| §13 Testing plan | Tasks 4, 7, 8, 9, 16 (Zod, slides, routes, MetricCard) |

---

## Open implementation notes

- **System prompt placeholders.** Task 6 leaves the bulk of the system prompt as `[ENGINEER NOTE: paste here]` markers because the verbatim text is large and lives in the brainstorming transcript / user input. Before the app runs end-to-end, the engineer must paste the full Question Bank, Scoring Review and Relational Understanding, and Output sections into `lib/prompts/system.ts`. The §11 addition is the only inline content because it's short and load-bearing.
- **Feedback link.** The `(Google Form link to be provided)` placeholder in the Feedback section will be replaced by the user later — non-blocking.
- **Model upgrade lever.** `lib/config.ts` exports `CHAT_MODEL` and `JUDGE_MODEL`. Swapping `CHAT_MODEL` to `claude-opus-4-7` is a one-line change.
- **StrictMode double-fire.** Task 13's `useFirstRender` ref pattern is intentionally minimal. If the engineer hits double-fires in dev (StrictMode), refactor to a state-based flag rather than a ref.
- **Dev / build smoke.** The plan does not include a separate `npm run lint` task because Next's default ESLint config runs in `npm run build`. If the engineer wants stricter pre-commit checking, add a `lint-staged` config in a follow-up task.
