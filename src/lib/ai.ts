import "server-only";
import { generateText as aiGenerateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { env, hasAI, aiProvider, PROVIDER_LABELS } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { reserveCall } from "./usage";
import { createThrottle } from "./throttle";

// One Groq client for the process. Authentication uses GROQ_API_KEY directly;
// no Vercel AI Gateway credential is involved.
const groq = createGroq({ apiKey: env.GROQ_API_KEY });

// Keep a small gap between LLM calls to avoid provider rate bursts. This is
// independent from Tavily's throttle and can be tuned with GROQ_MIN_SPACING_MS.
const throttleGroq = createThrottle(
  Number.parseInt(process.env.GROQ_MIN_SPACING_MS || "1200", 10) || 1200
);

// Gateway free-tier requests need a slower shared queue across generation
// and web research. The delay also applies after a rejected request.
export const throttleGateway = createThrottle(
  Number.parseInt(process.env.AI_MIN_SPACING_MS || "20000", 10) || 20000
);

/**
 * Calls the Groq model and returns raw text. Throws AgentDependencyError on any
 * transport/auth/budget failure so callers report "research incomplete"
 * instead of inventing a result.
 */
export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!hasAI()) {
    throw new AgentDependencyError(
      "LLM generation is not configured. Use Vercel AI Gateway or configure GROQ_API_KEY."
    );
  }

  // Reserve against the application guardrails before making a provider call.
  const provider = aiProvider();
  const label = PROVIDER_LABELS[provider];
  await reserveCall(provider);

  try {
    // Serialize through the Groq throttle to reduce rate bursts; a call that
    // still fails uses the AI SDK's bounded retries.
    const { text } = await (provider === "groq" ? throttleGroq : throttleGateway)(() =>
      aiGenerateText({
        model: provider === "groq" ? groq(env.GROQ_MODEL) : env.AI_MODEL,
        maxOutputTokens: params.maxTokens ?? 4096,
        system: params.system,
        prompt: params.prompt,
        maxRetries: provider === "groq" ? 3 : 0,
        abortSignal: AbortSignal.timeout(env.GROQ_TIMEOUT_MS),
      })
    );
    if (!text || !text.trim()) {
      throw new AgentDependencyError("Model returned no text content.");
    }
    return text;
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (/abort|timed?\s*out|timeout/i.test(message)) {
      throw new AgentDependencyError(
        `${label} did not respond within ${Math.round(env.GROQ_TIMEOUT_MS / 1000)} seconds. Retry the run shortly.`
      );
    }
    if (/rate.?limit|429|too many requests/i.test(message)) {
      throw new AgentDependencyError(
        `${label} is temporarily rate-limited. No changes were lost — ` +
          "wait a minute and run again. The daily/weekly/monthly budget caps in Settings keep " +
          "application calls within the configured guardrails."
      );
    }
    if (/api key|unauthorized|401|invalid.*key/i.test(message)) {
      throw new AgentDependencyError(
        `${label} rejected authentication. Check the provider credentials or Vercel OIDC configuration.`
      );
    }
    throw new AgentDependencyError(`${label} call failed: ${message}`);
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
