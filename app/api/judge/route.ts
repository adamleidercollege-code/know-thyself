import Anthropic from "@anthropic-ai/sdk";
import { JUDGE_MODEL, JUDGE_MAX_TOKENS } from "@/lib/config";
import { JUDGE_PROMPT } from "@/lib/prompts/judge";
import { RETURN_CORRECTED_ASSESSMENT_TOOL } from "@/lib/tool";
import { AssessmentSchema } from "@/lib/schema";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: { transcript?: unknown; draftJson?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.transcript) || !body.draftJson) {
    return Response.json({ error: "transcript and draftJson required" }, { status: 400 });
  }
  const transcript = body.transcript as ChatMessage[];
  const draftJson = body.draftJson;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userText = [
    "Conversation transcript (JSON array of messages):",
    JSON.stringify(transcript, null, 2),
    "",
    "Draft JSON to review:",
    JSON.stringify(draftJson, null, 2),
  ].join("\n");

  async function callJudge(extraInstruction?: string) {
    const systemBlocks = [{ type: "text" as const, text: JUDGE_PROMPT }];
    const userContent = extraInstruction
      ? `${userText}\n\nNote: your previous response did not match the schema (${extraInstruction}). Try again.`
      : userText;
    return client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: JUDGE_MAX_TOKENS,
      system: systemBlocks,
      tools: [RETURN_CORRECTED_ASSESSMENT_TOOL],
      tool_choice: { type: "tool", name: "return_corrected_assessment" },
      messages: [{ role: "user", content: userContent }],
    });
  }

  function extractToolInput(response: Anthropic.Message): unknown {
    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "return_corrected_assessment") {
        return block.input;
      }
    }
    return null;
  }

  try {
    let response = await callJudge();
    let input = extractToolInput(response);
    let parsed = AssessmentSchema.safeParse(input);
    if (!parsed.success) {
      response = await callJudge(parsed.error.message);
      input = extractToolInput(response);
      parsed = AssessmentSchema.safeParse(input);
    }
    if (!parsed.success) {
      return Response.json({ correctedJson: draftJson, draftFallback: true });
    }
    return Response.json({ correctedJson: parsed.data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return Response.json(
      { correctedJson: draftJson, draftFallback: true, error: msg },
      { status: 200 }
    );
  }
}
