import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, hasAI } from "./env";
import { AgentDependencyError } from "./agents/errors";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!hasAI()) {
    throw new AgentDependencyError(
      "ANTHROPIC_API_KEY is not configured. Set it in your environment to enable AI generation."
    );
  }
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Calls the model and returns raw text. Throws AgentDependencyError on any
 * transport/auth failure so callers can report "research incomplete"
 * instead of inventing a result.
 */
export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getClient();
  try {
    const response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });
    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      throw new AgentDependencyError("Model returned no text content.");
    }
    return block.text;
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AgentDependencyError(`Anthropic API call failed: ${message}`);
  }
}

/** Extracts the first JSON object/array from a model response, tolerating markdown fences. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new AgentDependencyError("Model response did not contain JSON.");
  }
  const trimmed = candidate.slice(start);
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Try trimming trailing commentary after the last closing brace/bracket.
    const lastBrace = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (lastBrace !== -1) {
      try {
        return JSON.parse(trimmed.slice(0, lastBrace + 1)) as T;
      } catch {
        // fall through
      }
    }
    throw new AgentDependencyError("Model response was not valid JSON.");
  }
}

export async function generateJSON<T>(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await generateText(params);
  return extractJson<T>(text);
}
