import "server-only";
import { generateText as aiGenerateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { env, hasAI } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { reserveCall } from "./usage";
import { createThrottle } from "./throttle";

// One Groq client for the process. Auth is an explicit free API key
// (GROQ_API_KEY) — no Vercel AI Gateway credit is used.
const groq = createGroq({ apiKey: env.GROQ_API_KEY });

// Groq's free tier caps tokens-per-minute, so keep a small gap between LLM
// calls to avoid TPM bursts. Independent from Tavily's throttle. Tune with
// GROQ_MIN_SPACING_MS.
const throttleGroq = createThrottle(
  Number.parseInt(process.env.GROQ_MIN_SPACING_MS || "1200", 10) || 1200
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
      "LLM generation is not configured. Add a free Groq API key (GROQ_API_KEY) — " +
        "create one at console.groq.com, no credit card required."
    );
  }

  // Enforce the free-tier budget BEFORE spending a call (daily/weekly/monthly).
  await reserveCall("groq");

  try {
    // Serialize through the Groq throttle to respect the free-tier per-minute
    // limit; a call that still fails fails fast (maxRetries 3 ≈ 2s,4s,8s).
    const { text } = await throttleGroq(() =>
      aiGenerateText({
        model: groq(env.GROQ_MODEL),
        maxOutputTokens: params.maxTokens ?? 4096,
        system: params.system,
        prompt: params.prompt,
        maxRetries: 3,
      })
    );
    if (!text || !text.trim()) {
      throw new AgentDependencyError("Model returned no text content.");
    }
    return text;
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (/rate.?limit|429|too many requests/i.test(message)) {
      throw new AgentDependencyError(
        "Groq is temporarily rate-limited (free-tier per-minute cap). No changes were lost — " +
          "wait a minute and run again. The daily/weekly/monthly budget caps in Settings keep " +
          "usage within Groq's free tier."
      );
    }
    if (/api key|unauthorized|401|invalid.*key/i.test(message)) {
      throw new AgentDependencyError(
        "Groq rejected the API key. Check that GROQ_API_KEY is a valid free key from console.groq.com."
      );
    }
    throw new AgentDependencyError(`Groq call failed: ${message}`);
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
