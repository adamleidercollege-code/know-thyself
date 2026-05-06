import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      stream: vi.fn().mockImplementation(async function* () {
        yield { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } };
        yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hello" } };
        yield { type: "content_block_stop", index: 0 };
        yield { type: "message_stop" };
      }),
    };
  }
  return { default: MockAnthropic };
});

import { POST } from "../route";

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
