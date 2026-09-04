import "server-only";
import { generateText as aiGenerateText, generateObject } from "ai";
import { z } from "zod";
import { env } from "./env";
import { AgentDependencyError } from "./agents/errors";

/**
 * Calls the model through the Vercel AI Gateway and returns raw text.
 * Throws AgentDependencyError on any transport/auth failure so callers can
 * report "research incomplete" instead of inventing a result.
 *
 * Authentication is zero-config in v0 previews and Vercel deployments — the
 * runtime supplies the AI Gateway credentials automatically, so no provider
 * API key is required.
 */
export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  try {
    const { text } = await aiGenerateText({
      model: env.AI_MODEL,
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxTokens ?? 4096,
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

/**
 * Generates a validated array of items using the AI SDK's structured-output
 * mode. This forces the model to return schema-conforming JSON, so it does not
 * depend on the model wrapping output in fences or omitting commentary.
 */
export async function generateArray<T>(params: {
  system: string;
  prompt: string;
  itemSchema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T[]> {
  try {
    const { object } = await generateObject({
      model: env.AI_MODEL,
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxTokens ?? 4096,
      schema: z.object({ items: z.array(params.itemSchema) }),
    });
    return object.items;
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AgentDependencyError(`AI Gateway structured call failed: ${message}`);
  }
}
