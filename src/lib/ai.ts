import "server-only";
import { generateText as aiGenerateText } from "ai";
import { hasAI, getAiModels } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { reserveAiCall } from "./usage";

/**
 * Calls the model through the Vercel AI Gateway and returns raw text.
 *
 * Authentication is zero-config on Vercel/v0 (OIDC), so no provider API key is
 * needed. Models are referenced with Gateway `provider/model` ids (see AI_MODEL
 * / AI_FALLBACK_MODELS in env): the primary is tried first and, if it is
 * unavailable or rate-limited even after the SDK's per-model retries, the next
 * fallback model is tried. Throws AgentDependencyError only when every model
 * fails, so callers report "research incomplete" instead of inventing a result.
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

  // Enforce the daily budget cap BEFORE spending a model call. One logical call
  // reserves one unit no matter how many fallback models it ends up trying.
  // Thrown as an AgentDependencyError so it propagates like a missing dependency.
  await reserveAiCall();

  const models = getAiModels();
  // The free-tier limit is per-minute and account-wide, so a burst can throttle
  // EVERY model at once. When that happens we cool down and try the whole chain
  // again — the window usually resets within a minute — instead of failing the
  // run. Passes: immediate, then after ~15s and ~30s (kept within the route's
  // maxDuration budget).
  const cooldownsMs = [0, 15_000, 30_000];
  let lastMessage = "no models configured";
  let lastWasRateLimit = false;

  for (let pass = 0; pass < cooldownsMs.length; pass++) {
    if (pass > 0) {
      if (!lastWasRateLimit) break; // only cool down for rate limits
      await sleep(cooldownsMs[pass]);
    }

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        const { text } = await aiGenerateText({
          model,
          maxOutputTokens: params.maxTokens ?? 4096,
          system: params.system,
          prompt: params.prompt,
          // The SDK retries transient failures with exponential backoff
          // (~2s, 4s); after that we move to the next fallback model.
          maxRetries: 2,
        });
        if (!text || !text.trim()) {
          throw new Error("Model returned no text content.");
        }
        return text;
      } catch (err) {
        lastMessage = err instanceof Error ? err.message : String(err);
        lastWasRateLimit = isRateLimit(lastMessage);
      }
    }
  }

  throw new AgentDependencyError(
    `AI Gateway call failed for all models (${models.join(", ")}). Last error: ${lastMessage}`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimit(message: string): boolean {
  return /rate.?limit|429|too many requests/i.test(message);
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
