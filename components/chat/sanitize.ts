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
    if (streaming && isLast && couldBecomeScorecard(p)) continue;
    kept.push(p);
  }
  return kept.join("\n\n").trim();
}
