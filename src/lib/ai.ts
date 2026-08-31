import "server-only";
import { generateText as aiGenerateText } from "ai";
import { env, hasAI } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { reserveAiCall } from "./usage";

/**
 * Calls the model through the Vercel AI Gateway and returns raw text.
 *
 * Authentication is zero-config on Vercel/v0 (OIDC), so no provider API key is
 * needed. The model is referenced with a Gateway `provider/model` id (see
 * AI_MODEL in env). Throws AgentDependencyError on any transport/auth failure
 * so callers can report "research incomplete" instead of inventing a result.
 */
export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!hasAI()) {
    throw new AgentDependencyError(
      "AI generation is not configured. On Vercel/v0 the AI Gateway is zero-config; " +
        "locally, set AI_GATEWAY_API_KEY to enable AI generation."
    );
  }

  // Enforce the daily budget cap BEFORE spending a model call. Thrown as an
  // AgentDependencyError so it propagates like any other missing dependency.
  await reserveAiCall();

  try {
    const { text } = await aiGenerateText({
      model: env.AI_MODEL,
      maxOutputTokens: params.maxTokens ?? 4096,
      system: params.system,
      prompt: params.prompt,
      // The AI Gateway free tier is rate-limited per minute. The SDK retries
      // with exponential backoff (~2s, 4s, 8s, 16s, 32s), so 5 retries ride
      // out a full ~1-minute window instead of failing fast on a burst.
      maxRetries: 5,
    });
    if (!text || !text.trim()) {
      throw new AgentDependencyError("Model returned no text content.");
    }
    return text;
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AgentDependencyError(`AI Gateway call failed: ${message}`);
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
