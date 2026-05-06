import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: createMock };
  }
  return { default: MockAnthropic };
});

import { POST } from "../route";

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
