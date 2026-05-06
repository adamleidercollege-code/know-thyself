# Know Thyself — Design Spec

**Status:** Draft for review
**Date:** 2026-05-06
**Author:** brainstorming session, captured for implementation

## 1. Goal

A deployable web app where a college student has a 15–20 question conversation with an AI that privately scores them across eight psychological and cognitive metrics. At the end, a slideshow reveals their profile — strengths, areas for growth, metric interactions, and actionable suggestions — followed by an optional single-scroll "full results" view. Designed as an undergraduate senior project; framed as proof-of-concept rather than a production mental-health tool.

## 2. Scope

In scope:

- Two-model pipeline: chat model conducts the assessment via tool use, judge model independently reviews and corrects the JSON before render.
- Editorial visual style on every view.
- Slideshow primary results experience + full-scroll alternate view.
- Persistent footer with six expandable sections (text provided).
- Ephemeral session state — refresh resets, no DB, no auth, no PII collected.
- Vercel deployment.

Out of scope (deferred):

- Saved results / shareable links / PDF export.
- User accounts.
- Admin views, analytics dashboards, multi-tenancy.
- Conversation resume across page loads.
- Internationalization.

## 3. Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript.
- **Styling:** Tailwind CSS, with custom CSS variables for the Editorial palette and `next/font` for Source Serif Pro + Inter.
- **AI:** `@anthropic-ai/sdk` directly on server routes. No Vercel AI SDK.
- **Models:** Sonnet 4.6 for both chat and judge, exposed as constants in a config file (one-line swap to Opus 4.7 for chat).
- **Validation:** Zod for the corrected-JSON schema.
- **Animation:** Framer Motion for slideshow transitions.
- **State:** Local React state only. No global store. No persistence layer.
- **Deployment:** Vercel. API key in `ANTHROPIC_API_KEY` env var (server-only).

## 4. High-level architecture

The app is a single Next.js page (`/`). All state lives client-side in one top-level component. State machine:

```
intro → chat → judging → slideshow → fullResults
                ↑                          ↓
                └──────── (back) ──────────┘
```

- `intro` — landing copy, "Begin" button.
- `chat` — message thread + composer, streams from `/api/chat`.
- `judging` — brief loader while `/api/judge` runs.
- `slideshow` — primary results experience.
- `fullResults` — single-scroll view; can return to slideshow.

Refresh resets to `intro`. The persistent footer is rendered above this state machine and is visible in every state.

Two API routes, both server-only, both POST:

- `/api/chat` — streaming. Forwards Anthropic Messages API stream to the client.
- `/api/judge` — non-streaming. One round-trip for review.

The Anthropic API key never reaches the client. The system prompt and judge prompt are stored in server-only modules.

### File layout

```
app/
  layout.tsx                  # html/body, font setup, footer slot
  page.tsx                    # state machine root
  api/
    chat/route.ts             # POST → stream
    judge/route.ts            # POST → JSON

components/
  intro/IntroView.tsx
  chat/ChatView.tsx
  chat/MessageList.tsx
  chat/Composer.tsx
  judging/JudgingView.tsx
  results/
    ResultsView.tsx           # owns mode + slide index
    Slideshow.tsx             # framer-motion wrapper
    FullResults.tsx           # single-scroll view
    slides/
      ProfileSlide.tsx
      StrengthsGrowthSlide.tsx
      SuggestionSlide.tsx
      MetricsSlide.tsx
      InteractionsSlide.tsx
      FinSlide.tsx
    parts/
      ProfileHero.tsx         # shared by slideshow + full
      MetricCard.tsx
      SuggestionCard.tsx
      InteractionItem.tsx
      HangingNumberList.tsx
  footer/Footer.tsx
  footer/FooterPanel.tsx

lib/
  config.ts                   # CHAT_MODEL, JUDGE_MODEL, MAX_TOKENS, etc.
  prompts/system.ts           # full system prompt (server-only)
  prompts/judge.ts            # full judge prompt (server-only)
  prompts/footer-copy.ts      # six footer sections
  schema.ts                   # Zod schema + inferred TS types
  anthropic.ts                # SDK client + helpers
  tool.ts                     # submit_assessment tool definition
```

## 5. Conversation flow

### 5.1 Intro view

- Centered. Small uppercase label "KNOW THYSELF". Large serif italic title (or simply the wordmark — final treatment in implementation). One sentence subtitle: "A 10–15 minute conversation that reveals how you think." Single primary button "Begin".
- Click → state advances to `chat`. The first `/api/chat` request fires immediately with an empty user history; the AI's first streamed message *is* its first question. The intro is the app talking; the AI itself follows the system prompt's "no introduction" rule.

### 5.2 Chat view

- Compact "Know Thyself" wordmark in the corner.
- Single-column message thread, max width ~640px. Assistant messages left-aligned, user messages right-aligned. Serif body, generous line-height.
- Composer at the bottom: auto-growing textarea + send button. Enter sends, Shift+Enter newline.
- Streaming: assistant tokens stream in as they arrive. Small typing indicator until first token of each turn.
- Footer collapsed to a thin strip below the composer.

### 5.3 Server: `/api/chat`

```ts
POST /api/chat
Body: { messages: ChatMessage[] }
Response: text/event-stream (Anthropic stream events forwarded as SSE)
```

Server uses `anthropic.messages.stream()` with:

- `model: CHAT_MODEL` (Sonnet 4.6 by default).
- `system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }]` — caches the ~7k-token prompt across turns.
- `tools: [SUBMIT_ASSESSMENT_TOOL]` — JSON-schema-typed tool.
- `max_tokens: 2048`.

The system prompt is large and stable, so prompt caching pays back quickly: each turn after the first reads the cached prompt at ~10% of the input cost.

### 5.4 Tool use detection (client side)

Each turn's stream contains text deltas, possibly followed by a tool-use block. The client maintains:

- A visible assistant message bubble that grows as text deltas arrive.
- A hidden buffer that accumulates the tool-use input JSON string as deltas arrive.

On `message_stop`:

- If `stop_reason === "end_turn"` and no tool-use occurred: normal mid-conversation turn. User types again.
- If `stop_reason === "tool_use"` and the tool name is `submit_assessment`:
  1. Parse the accumulated JSON. Treat it as `draftJson`.
  2. Keep the closing assistant text visible in the chat (the model's "That gives me a good picture — putting your results together now." or equivalent).
  3. Transition state to `judging`.

The tool input JSON is structurally guaranteed by the Anthropic API to match the `input_schema` we register. Validation against our Zod schema still runs as a defensive layer.

### 5.5 Judging view

- Brief screen: italic serif "Putting your results together…" with a subtle pulsing indicator. Footer remains visible.
- Client POSTs `/api/judge` with `{ transcript: messages, draftJson }`.

### 5.6 Server: `/api/judge`

```ts
POST /api/judge
Body: { transcript: ChatMessage[], draftJson: AssessmentJson }
Response: { correctedJson: AssessmentJson } | { error: string, draftFallback: true }
```

To eliminate free-text JSON parsing risk, the judge call is wrapped in its own tool:

- `system: JUDGE_PROMPT` (with the same `cache_control: ephemeral` for cost benefit if the prompt is long).
- `tools: [{ name: "return_corrected_assessment", input_schema: AssessmentJsonSchema }]`.
- `tool_choice: { type: "tool", name: "return_corrected_assessment" }` — forces the model to call this tool, eliminating any chance of the model returning prose.
- User message contains the transcript + the draft JSON.

The returned tool input is the corrected JSON. Validate against Zod. On validation failure: retry once with a stricter follow-up message indicating the schema mismatch. On second failure: respond with `draftFallback: true` and let the client render the original draft JSON.

### 5.7 Slideshow → fullResults

Covered in §8 (Slideshow) and §9 (Full Results) below.

## 6. JSON schema (the contract)

Both the `submit_assessment` tool (chat model output) and the `return_corrected_assessment` tool (judge model output) use the same input schema. The structure matches the schema provided by the user.

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

export const MetricSchema = z.object({
  name: z.enum(METRIC_NAMES),
  score: z.number().int().min(1).max(5),
  summary: z.string().min(1),
  detail: z.string().min(1),
  interactions: z.array(z.enum(METRIC_NAMES)),
});

export const InteractionSchema = z.object({
  metrics: z.array(z.enum(METRIC_NAMES)).length(2),
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

export type Assessment = z.infer<typeof AssessmentSchema>;
```

Notes:

- **Metric names are an enum** — the chat model is instructed to use exactly these eight names, and the judge model's schema enforces it. This makes the metric grid render deterministic.
- **Score is a 1–5 integer**, no halves. Matches the prompt.
- **Suggestions: 3–5** — matches the prompt's stated range.

## 7. Visual design (Editorial)

### 7.1 Foundations

- **Background:** warm off-white `#faf8f3`.
- **Body ink:** `#1a1a1a`.
- **Accent:** terracotta `#b8541c` — used sparingly for labels, hanging numerals, and interactive affordances.
- **Muted ink:** `#6b6357` for secondary text, `#8a8175` for tertiary.
- **Rules:** `#ddd6c5` (top-level), `#e8e2d2` (within sections).
- **Typography:** Source Serif Pro for headlines and body; Inter for UI (labels, buttons, score numerals, footer titles). Small caps with letter-spacing (`.18em`–`.22em`) for all uppercase labels.
- **Reading width:** max ~720px main column, ~640px chat thread.
- **Vertical rhythm:** ~96px between top-level sections; ~32px between cards.

### 7.2 Score visualization (full-range neutral)

Each metric card shows the score as a large serif numeral (e.g., **4**) with `/ 5` in small Inter caps next to it, plus a row of five dots below. **Exactly one dot is filled at the score's position; the other four are visible but unfilled.** A score of 1 and a score of 5 have identical visual weight — one filled dot each — at opposite ends of the scale.

This is intentional and load-bearing for the design:

- Anxiety is the only metric where high score = a growth area rather than a strength. Position-based dots ensure the metric card itself is neutral. The strengths / areas-for-growth / suggestions sections — written by the model — carry interpretation.
- Per the system prompt addition (see §11), scores will realistically span the full 1–5 range. No score should look "broken" or "alarming." Position-based dots scale equally well across the entire range.

### 7.3 Footer

- Persistent across all five views. Sits at the bottom with a thin top rule.
- Six titles in Inter small caps, terracotta, slightly bolder than body (font-weight 600), letter-spaced. Hover state underlines.
- Click any title → that section expands as an overlay panel sliding up from the footer (~60% viewport height, dismissable; near-full screen on mobile). Other panels close when one opens.
- Sources panel renders as a serif bibliography (the longest of the six). Privacy is one paragraph. About is short. Feedback ends with a placeholder link until the Google Form URL is provided.
- Footer copy is in **Appendix C** below, verbatim from the user.

## 8. Slideshow

### 8.1 Slide list

Generated dynamically from the corrected JSON. Total slide count is `6 + suggestions.length`, ranging 9–11 (since `suggestions.length ∈ {3, 4, 5}`).

Let `S = suggestions.length`. Slides, in order:

| # | Slide | Source data |
|---|-------|-------------|
| 1 | Profile reveal | `profile_type`, `profile_description` |
| 2 | Strengths · Areas for Growth (side-by-side) | `strengths`, `areas_for_growth` |
| 3 .. 2+S | Suggestion (one per slide) | `suggestions[i]` |
| 3+S | Metrics 1 of 2 | `metrics[0..3]` |
| 4+S | Metrics 2 of 2 | `metrics[4..7]` |
| 5+S | How These Connect | `interactions` |
| 6+S (last) | Fin / CTA | "View Full Results" button |

Two slides of four metrics (rather than eight on one scrollable slide) match the slideshow's deliberate pacing.

### 8.2 Slide layouts

- **Profile reveal:** full-screen centered. Small "PROFILE" label, large serif italic `profile_type` (~56px on desktop), serif body `profile_description` (max width ~540px). Slightly delayed entrance on the title (~200ms after the rest) for a curtain-lift feel.
- **Strengths · Areas for Growth:** two columns separated by a thin vertical rule. Each column has a section label and a hanging-numeral list (terracotta numeral in left margin, serif paragraph). Stacks vertically on mobile.
- **Suggestion:** centered content. Hanging numeral (e.g., **1**) at ~36px, terracotta italic. Title in serif bold (~28px). Italic deck (~17px) below title. Full detail paragraph visible by default — no "Read more" expand at this pacing.
- **Metrics (2 slides of 4):** 2×2 grid of metric cards. Cards keep summary visible; detail still gated behind "Read more" so each card stays short and the slide doesn't feel cluttered.
- **Interactions:** section header + interaction items stacked. Each item: pair line in serif italic with a terracotta em-dash glyph between metric names, body description in serif. Items separated by thin rules.
- **Fin / CTA:** centered. Small "FIN" label, italic serif line "That's your profile.", primary button "View Full Results →" (Inter caps, ink background, off-white text), muted hint below ("…or use ← to revisit any slide.").

### 8.3 Navigation

- **Arrow buttons:** circular outlined `←` and `→`, fixed at vertical mid-edges. Default opacity ~55%, full on hover. Left arrow hidden on slide 1 (or rendered at very low opacity for spatial anchoring). Right arrow hidden on Fin slide; the CTA button replaces it.
- **Keyboard:** `→` and `Space` advance; `←` goes back. Listeners attached at the slideshow root, removed on unmount and when in `fullResults`. Disabled when an expanded `Read more` panel within a metric card has focus inside it.
- **Progress indicator:** bottom center, just above the footer. Format: `3 / 9` in Inter small caps with letter-spacing. Numeric form chosen over dots for Editorial restraint.
- **No click-to-advance** on the slide body — too easy to misfire on `Read more`.

### 8.4 Transitions

- Crossfade with subtle horizontal drift (~12px in the direction of travel for the outgoing slide; opposite direction for the incoming slide). Duration ~280ms, ease-out. Implemented with Framer Motion `AnimatePresence`.
- `prefers-reduced-motion: reduce` → drop the drift, keep only the fade.

## 9. Full Results view

Reached via the "View Full Results" button on the Fin slide. State transitions to `fullResults`.

- Single-column scrolling layout, max width ~720px, same Editorial typography as slideshow.
- Section order matches slideshow: profile hero → strengths → areas for growth → suggestions → 8 metric cards → interactions → footer.
- Metric cards in a two-column grid on desktop, single column on mobile.
- Suggestions and metric cards both use "Read more" expand for detail (since the page is already long, default-collapsed keeps it scannable).
- Subtle "← Back to slideshow" link at the very top in Inter small caps, terracotta. Returns to the Fin slide of the slideshow with `slideIndex = lastIndex`.
- "Print results" button at the bottom (Inter caps, terracotta) that triggers `window.print()`. A `@media print` block in the global stylesheet hides the footer and "Back to slideshow" link, force-expands all `Read more` panels, normalizes background to white, removes shadows, and adds page-break hints between major sections so a metric card doesn't split across pages. No JS state changes — pure media query. **In scope for v1.**

Slideshow and full-results share components: `ProfileHero`, `MetricCard`, `SuggestionCard`, `InteractionItem`, `HangingNumberList`. The two views are layouts over a single component library.

## 10. Error handling and edge cases

| Failure | Behavior |
|---------|----------|
| `/api/chat` HTTP error mid-conversation | Inline error message in chat with "Try again" button. Resends the last turn. No data loss in visible thread. |
| Stream connection drop | "Connection lost — retry?" inline, button replays from last user message. |
| Anthropic 429 / rate limit on chat | Exponential backoff up to 3 retries server-side before surfacing error. |
| `/api/judge` total failure (after 1 retry) | Render results using `draftJson` directly. Display a small notice on the slideshow's profile slide: "Results displayed without secondary review." User experience continues. |
| Malformed JSON from chat tool use | Should not happen — Anthropic guarantees the tool input matches `input_schema`. As a defensive measure, validation runs against Zod on receipt. On validation failure, treat as a chat-level error and offer retry. |
| User refreshes during chat | All state is lost; intro view re-renders. Acceptable per the ephemeral persistence decision. |
| User refreshes during slideshow | Same — back to intro. The 10-minute conversation is gone. Document this clearly in the Privacy footer panel. |
| Metric card detail expanded on the slideshow when user advances slide | Detail collapses on slide change. Don't carry expanded state across slides. |
| Browser without keyboard (mobile) | Arrow buttons remain primary nav; keyboard nav is additive. |

## 11. System prompt addition

Per user request, the following paragraph is to be inserted into the existing system prompt's **Scoring System** section, directly after the confidence-check paragraph. It works in deliberate tension with the judge prompt's "score is overconfident" rule: the chat model is encouraged to be decisive when evidence supports it, while the judge model retains the authority to nudge scores toward 3 only when the transcript truly lacks evidence.

> Do not shy away from scores of 1, 2, 4, or 5. A score of 3 should only appear in the final output if genuine uncertainty remains after all questioning for that metric is complete. Strong clear signal in either direction should produce a score of 1-2 or 4-5. Clustering scores around 3 produces a profile that is unhelpfully neutral and fails the user. A person who clearly demonstrates high self-efficacy should receive a 4 or 5. A person who clearly demonstrates poor executive function should receive a 1 or 2. Err toward decisiveness when the evidence supports it.

This addition is a load-bearing reason for the score visualization choice in §7.2: scores will realistically span the full 1–5 range, and no position should look "broken" or "alarming."

## 12. Open considerations

- **Model upgrade path.** Sonnet 4.6 is the v1 default. If the senior project demo shows scoring quality is the marginal axis, switching `CHAT_MODEL` in `lib/config.ts` to `claude-opus-4-7` is a one-line change. Cost difference is meaningful (~5–8×) but the cache hit on the system prompt softens it for repeat users.
- **Profile-type ceremony.** The profile reveal slide carries the most product weight. If the entrance animation feels under- or over-tuned during implementation, expect to iterate on it. Acceptable to adjust without re-spec.
- **Feedback link.** The Feedback footer panel ends with a placeholder until the user provides a Google Form URL.

## 13. Testing plan

- **Unit:** Zod schema round-trips on representative JSON; metric-name enum coverage; slide-list builder for `suggestions.length ∈ {3, 4, 5}`.
- **Component:** each slide component renders correctly with placeholder data; metric card position-based dots render correctly for scores 1–5; Read-more expand/collapse behavior.
- **Integration:** mock Anthropic SDK on the API routes; verify tool-use detection, judge fallback path, validation retry path.
- **End-to-end:** scripted run with a pre-recorded transcript validates the full intro → chat → judging → slideshow → fullResults loop. Real Anthropic calls deferred to manual QA on staging.
- **Accessibility:** keyboard-only flow through slideshow + footer panels; `prefers-reduced-motion` honored; tab order sensible; focus-visible on all interactive elements.

---

## Appendix A — System prompt (verbatim)

The full system prompt is stored in `lib/prompts/system.ts` (server-only, never sent to the client). It contains four sections — Opening, Question Bank, Scoring Review and Relational Understanding, Output — followed by a question bank for each of the eight metrics. The user-supplied text is the canonical source. The §11 addition is to be inserted in the Scoring System subsection.

## Appendix B — Judge prompt (verbatim)

Stored in `lib/prompts/judge.ts` (server-only). The user-supplied text is the canonical source. Note the implementation tweak in §5.6: the judge call is wrapped in a `return_corrected_assessment` tool with `tool_choice: { type: "tool", name: "return_corrected_assessment" }` rather than relying on the prompt's "return only JSON" instruction. The wrapper is structurally safer; the prompt's text remains as the model's instructions.

## Appendix C — Footer copy (verbatim)

Stored in `lib/prompts/footer-copy.ts`. Six sections, in this order:

### How It Works

This tool conducts a structured psychological assessment through natural conversation. As you answer questions, the model privately evaluates your responses across eight validated cognitive and psychological metrics. Each question is drawn from a curated bank grounded in peer-reviewed psychometric research and is selected adaptively based on your previous answers. At the end of the conversation, a second AI model independently reviews the assessment for consistency and accuracy before your results are generated. Your profile reflects patterns in how you think, manage yourself, and relate to challenge — not a clinical diagnosis or a fixed verdict.

### Sources

The following peer-reviewed frameworks and instruments informed the design of this assessment:

- Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191–215.
- Barkley, R.A. (1997). Behavioral inhibition, sustained attention, and executive functions. *Psychological Bulletin*, 121(1), 65–94.
- Beck, A.T., Epstein, N., Brown, G., & Steer, R.A. (1988). An inventory for measuring clinical anxiety. *Journal of Consulting and Clinical Psychology*, 56(6), 893–897.
- Derryberry, D. & Reed, M.A. (2002). Anxiety-related attentional biases and their regulation by attentional control. *Journal of Abnormal Psychology*, 111(2), 225–236.
- Dweck, C.S. (2006). *Mindset: The New Psychology of Success*. Random House.
- Dweck, C.S. & Leggett, E.L. (1988). A social-cognitive approach to motivation and personality. *Psychological Review*, 95(2), 256–273.
- Flavell, J.H. (1979). Metacognition and cognitive monitoring. *American Psychologist*, 34(10), 906–911.
- Gratz, K.L. & Roemer, L. (2004). Multidimensional assessment of emotion regulation and dysregulation. *Journal of Psychopathology and Behavioral Assessment*, 26(1), 41–54.
- Gross, J.J. (1998). The emerging field of emotion regulation. *Review of General Psychology*, 2(3), 271–299.
- Miyake, A. et al. (2000). The unity and diversity of executive functions. *Cognitive Psychology*, 41(1), 49–100.
- Pearlin, L.I. & Schooler, C. (1978). The structure of coping. *Journal of Health and Social Behavior*, 19(1), 2–21.
- Pintrich, P.R. & De Groot, E.V. (1990). Motivational and self-regulated learning components of classroom academic performance. *Journal of Educational Psychology*, 82(1), 33–40.
- Posner, M.I. & Petersen, S.E. (1990). The attention system of the human brain. *Annual Review of Neuroscience*, 13(1), 25–42.
- Rotter, J.B. (1966). Generalized expectancies for internal versus external control of reinforcement. *Psychological Monographs*, 80(1), 1–28.
- Schraw, G. & Dennison, R.S. (1994). Assessing metacognitive awareness. *Contemporary Educational Psychology*, 19(4), 460–475.
- Spielberger, C.D., Gorsuch, R.L., & Lushene, R.E. (1970). *Manual for the State-Trait Anxiety Inventory*. Consulting Psychologists Press.

### Limitations

This assessment is designed for self-reflection and educational purposes only. It is not a clinical psychological evaluation and should not be interpreted as a diagnosis or a substitute for professional mental health support. Results are generated by an AI model based on self-reported responses and are subject to the limitations of both language models and self-report methodology. Scores represent patterns observed in a single conversation and may not fully capture the complexity of your cognitive and psychological profile.

### Privacy

This tool does not store, log, or share your conversation or results. Everything happens in your browser — when you close this tab, all data is gone. No account is required and no personally identifiable information is collected. Your responses are sent to Anthropic's API solely for the purpose of generating your assessment and are subject to Anthropic's privacy policy.

### About

Know Thyself is a research project exploring how artificial intelligence can be used to assess cognitive and psychological patterns through adaptive conversation. It was developed as part of an undergraduate senior project and is intended as a proof of concept rather than a production mental health tool. If you have feedback on your experience or the accuracy of your results, please use the link below.

### Feedback

Did your results feel accurate? Was there anything that felt off or missing? Your feedback helps improve the assessment.

Share your feedback → *(Google Form link to be provided)*
