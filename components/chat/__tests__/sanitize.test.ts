import { describe, it, expect } from "vitest";
import { sanitizeAssistantText } from "../sanitize";

describe("sanitizeAssistantText", () => {
  it("returns plain question text unchanged", () => {
    const text = "When something goes wrong for you, what do you usually put it down to?";
    expect(sanitizeAssistantText(text)).toBe(text);
  });

  it("strips bolded scorecard heading and metric bullets, keeps the question after a horizontal rule", () => {
    const text = `**Internal scorecard update:**
- Locus of Control: 4 — consistent internal attribution across both positive and negative outcomes.

---

When you're heading into something difficult, what's your gut feeling about whether you can handle it?`;
    expect(sanitizeAssistantText(text)).toBe(
      "When you're heading into something difficult, what's your gut feeling about whether you can handle it?",
    );
  });

  it("drops a scorecard block with multiple metric bullets", () => {
    const text = `Internal scorecard:
- Locus of Control: 4
- Self-Efficacy: 3
- Anxiety: 2

How do you usually feel going into a real challenge?`;
    expect(sanitizeAssistantText(text)).toBe(
      "How do you usually feel going into a real challenge?",
    );
  });

  it("returns empty when the entire response is just a scorecard", () => {
    const text = `**Internal scorecard update:**
- Locus of Control: 4
- Self-Efficacy: 3

---`;
    expect(sanitizeAssistantText(text)).toBe("");
  });

  it("drops markdown-noise paragraphs like bare ** or ---", () => {
    expect(sanitizeAssistantText("**\n\n---\n\nWhat's on your mind?")).toBe("What's on your mind?");
  });

  it("during streaming, drops a paragraph that is becoming the scorecard heading", () => {
    expect(sanitizeAssistantText("**Internal scor", true)).toBe("");
    expect(sanitizeAssistantText("**Internal scorecard", true)).toBe("");
    expect(sanitizeAssistantText("Internal", true)).toBe("");
  });

  it("during streaming, keeps a question that's still streaming", () => {
    expect(sanitizeAssistantText("When you're heading into", true)).toBe("When you're heading into");
    expect(sanitizeAssistantText("How do you", true)).toBe("How do you");
  });

  it("does not match a metric name embedded mid-sentence", () => {
    const text = "Tell me about a time when Anxiety surprised you.";
    expect(sanitizeAssistantText(text)).toBe(text);
  });

  it("strips prose-form internal review before the closing line", () => {
    const text = `All metrics have directional scores and populated notes. Emotional Regulation at 3 has genuine tension between awareness and follow-through.

That gives me a good picture — I'll put your results together now.`;
    expect(sanitizeAssistantText(text)).toBe(
      "That gives me a good picture — I'll put your results together now.",
    );
  });

  it("strips multi-paragraph internal review prose", () => {
    const text = `Across all eight metrics, the picture is consistent.

Anxiety scores of 4 reinforce the Attentional Control signal.

Let me put your results together now.`;
    expect(sanitizeAssistantText(text)).toBe("Let me put your results together now.");
  });

  it("during streaming, suppresses partial internal review like 'Emotional Regulation at'", () => {
    expect(sanitizeAssistantText("All metrics", true)).toBe("");
    expect(sanitizeAssistantText("Emotional Regulation at", true)).toBe("");
    expect(sanitizeAssistantText("Anxiety scor", true)).toBe("");
  });

  it("keeps a closing statement that mentions a metric without review vocab", () => {
    const text = "I have a clear picture now — putting your results together.";
    expect(sanitizeAssistantText(text)).toBe(text);
  });
});
