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
});
