const METRIC_NAMES = [
  "Locus of Control",
  "Self-Efficacy",
  "Anxiety",
  "Attentional Control",
  "Emotional Regulation",
  "Growth Mindset",
  "Metacognition",
  "Executive Function",
];

const escaped = METRIC_NAMES.map((n) => n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|");

const SCORECARD_RX = /(internal\s+scorecard|scorecard\s+update|\bscorecard\s*[:\-—])/i;
const METRIC_BULLET_RX = new RegExp(`^[ \\t]*[-•*][ \\t]*\\**(?:${escaped})\\b`, "i");
const METRIC_LINE_RX = new RegExp(`^[ \\t]*\\**(?:${escaped})\\**\\s*[:\\-—]`, "i");
const METRIC_NAME_RX = new RegExp(`\\b(?:${escaped})\\b`, "i");
const REVIEW_VOCAB_RX =
  /\b(score[ds]?|note[ds]?|evidence|signal|confidence|directional(?:ly)?|populated|indicates?|synthesi[sz]e|tension|interaction[s]?|metacognitive|compounding|protective|contradictory|unified assessment)\b/i;
const SCORE_REFERENCE_RX = /\bat\s+[1-5]\b|\bscores?\s+of\s+[1-5]\b|\bis\s+a?\s*[1-5]\b|\b[1-5]\s*\/\s*5\b/i;
const SYNTHESIS_OPENING_RX = /\b(all (?:eight )?(?:metrics?|scores?)|each metric|every metric|both metrics|across the board|across all (?:eight )?metrics?)\b/i;

const HORIZONTAL_RULE_RX = /^\s*(?:[-=*_]{3,})\s*$/;
const MARKDOWN_NOISE_RX = /^[\s*_#>~`-]*$/;

const SCORECARD_TAIL_PHRASES = [
  "internal scorecard",
  "scorecard update",
  "scorecard:",
  "scorecard-",
  "scorecard—",
];

const SCORECARD_TAIL_WORDS = ["internal", "scorecard"];

function looksLikeInternalReview(p: string): boolean {
  const condensed = p.replace(/\s+/g, " ").trim();
  if (!condensed) return false;
  // Synthesis-style opener ("All metrics have...", "Across all eight metrics...").
  if (SYNTHESIS_OPENING_RX.test(condensed)) return true;
  // Specific metric named alongside review-process vocabulary.
  if (METRIC_NAME_RX.test(condensed) && REVIEW_VOCAB_RX.test(condensed)) return true;
  // Specific metric named alongside an explicit score reference like "at 3".
  if (METRIC_NAME_RX.test(condensed) && SCORE_REFERENCE_RX.test(condensed)) return true;
  return false;
}

// Word fragments that would resolve into review vocabulary mid-stream
// ("scor" → "scores", "evidenc" → "evidence"). Used only on the still-streaming
// last paragraph so review text is suppressed before its tell-tale words finish.
const REVIEW_PARTIAL_RX =
  /\b(scor|note[ds]?|evidenc|signal|confidenc|direction|populat|indicat|synthesi|tension|interaction|metacognitiv|compound|protective|contradictory|unified)/i;
const SYNTHESIS_PARTIAL_RX =
  /^(all|across|each|every|both)(\s+(eight|the|all))?(\s+(metric|score))?\b/i;

function couldBecomeInternalReview(p: string): boolean {
  const condensed = p.replace(/\s+/g, " ").trim();
  if (!condensed) return false;
  if (SYNTHESIS_PARTIAL_RX.test(condensed)) return true;
  if (METRIC_NAME_RX.test(condensed) && REVIEW_PARTIAL_RX.test(condensed)) return true;
  // "Emotional Regulation at" before "3" finishes streaming.
  if (METRIC_NAME_RX.test(condensed) && /\bat\s*$|\bat\s+[1-5]?$/i.test(condensed)) return true;
  return false;
}

function looksLikeScorecard(p: string): boolean {
  if (SCORECARD_RX.test(p)) return true;
  const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  let metricLines = 0;
  let nonMetricLines = 0;
  for (const line of lines) {
    if (METRIC_BULLET_RX.test(line) || METRIC_LINE_RX.test(line)) {
      metricLines++;
    } else {
      nonMetricLines++;
    }
  }
  return metricLines > 0 && metricLines >= nonMetricLines;
}

function isHorizontalRule(p: string): boolean {
  return HORIZONTAL_RULE_RX.test(p);
}

function isMarkdownNoise(p: string): boolean {
  return MARKDOWN_NOISE_RX.test(p);
}

function couldBecomeScorecard(p: string): boolean {
  const lower = p.toLowerCase().trim();
  if (!lower) return false;
  // The whole paragraph so far is a strict prefix of a canonical scorecard opener.
  const stripped = lower.replace(/^[*_#>\s]+/, "");
  for (const phrase of SCORECARD_TAIL_PHRASES) {
    if (stripped.length <= phrase.length && phrase.startsWith(stripped)) return true;
  }
  // Trailing partial word could be completing into "internal" / "scorecard"
  // — but only if it's the only word in the paragraph (avoids flickering on
  // legitimate questions that happen to start with "in" or "score").
  const onlyWord = lower.match(/^[*_#>\s]*(\S+)$/);
  if (onlyWord) {
    const trailing = onlyWord[1].replace(/[*_]+$/, "");
    for (const word of SCORECARD_TAIL_WORDS) {
      if (trailing.length < word.length && word.startsWith(trailing)) return true;
    }
  }
  return false;
}

export function sanitizeAssistantText(text: string, streaming = false): string {
  if (!text) return "";
  const parts = text.split(/\n\s*\n+/);
  const kept: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    const p = parts[i];
    if (!p.trim()) continue;
    if (isHorizontalRule(p)) continue;
    if (isMarkdownNoise(p)) continue;
    if (looksLikeScorecard(p)) continue;
    if (looksLikeInternalReview(p)) continue;
    if (streaming && isLast && couldBecomeScorecard(p)) continue;
    if (streaming && isLast && couldBecomeInternalReview(p)) continue;
    kept.push(p);
  }
  return kept.join("\n\n").trim();
}
