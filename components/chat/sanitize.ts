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

const SCORECARD_RX = /(internal\s+scorecard|scorecard\s+update|scorecard\s*[:\-—])/i;
const BULLET_METRIC_RX = new RegExp(`\\n[ \\t]*[-•*][ \\t]*(?:${escaped})`, "i");
const LINE_METRIC_RX = new RegExp(`\\n[ \\t]*(?:${escaped})\\s*[:\\-—]`, "i");

export function sanitizeAssistantText(text: string): string {
  if (!text) return text;

  let cut = text.length;

  const candidates: Array<RegExp | string> = [
    SCORECARD_RX,
    BULLET_METRIC_RX,
    LINE_METRIC_RX,
    "\n\n",
  ];
  for (const c of candidates) {
    const idx = typeof c === "string" ? text.indexOf(c) : text.search(c);
    if (idx >= 0 && idx < cut) cut = idx;
  }

  return text.slice(0, cut).trimEnd();
}
