import Anthropic from "@anthropic-ai/sdk";
import { CHAT_MODEL } from "@/lib/config";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { SUBMIT_ASSESSMENT_TOOL } from "@/lib/tool";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const FINALIZE_MAX_TOKENS = 8192;

export async function POST(req: Request) {
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }
  const messages = body.messages as ChatMessage[];

  const apiMessages: ChatMessage[] = [
    { role: "user", content: "Begin." },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // The closing turn ends with the assistant speaking. Anthropic requires the
  // last message be a user turn before the next assistant response, so append
  // a synthetic user nudge to call the tool.
  if (apiMessages[apiMessages.length - 1]?.role === "assistant") {
    apiMessages.push({
      role: "user",
      content:
        "The questioning phase is complete. Call submit_assessment now with the complete assessment JSON for everything we just discussed. Do not produce any other text.",
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: FINALIZE_MAX_TOKENS,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [SUBMIT_ASSESSMENT_TOOL],
      tool_choice: { type: "tool", name: "submit_assessment" },
      messages: apiMessages,
    });

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "submit_assessment") {
        return Response.json({ assessment: block.input });
      }
    }
    return Response.json({ error: "no tool call in response" }, { status: 502 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
