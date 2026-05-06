import Anthropic from "@anthropic-ai/sdk";
import { CHAT_MODEL, CHAT_MAX_TOKENS } from "@/lib/config";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { SUBMIT_ASSESSMENT_TOOL } from "@/lib/tool";

export const runtime = "nodejs";

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
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: "messages must be an array" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const messages = body.messages as ChatMessage[];

  // Anthropic requires messages to begin with a user turn. The assessment is
  // structured so the model speaks first (the opener), so we prepend a synthetic
  // user turn that the system prompt instructs the model to ignore.
  const apiMessages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: "Begin." },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: CHAT_MODEL,
    max_tokens: CHAT_MAX_TOKENS,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [SUBMIT_ASSESSMENT_TOOL],
    messages: apiMessages,
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
