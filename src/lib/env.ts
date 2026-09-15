import "server-only";

/**
 * Provider configuration.
 *
 * Free mode uses the Groq Free account directly:
 *   - LLM (extraction + content generation) → Groq (GROQ_API_KEY)
 *   - Web search                            → Groq Compound (GROQ_API_KEY)
 *
 * Usage is metered per provider across daily / weekly / monthly windows and
 * capped by configurable application guardrails (see usage.ts). Provider-side
 * quotas, billing and spend controls remain authoritative.
 */
export const env = {
  // Default to a direct Groq Free account; never fall back to metered services.
  FREE_ONLY: process.env.FREE_ONLY !== "false",
  ARTICLES_DAILY_LIMIT: Math.min(100, Math.max(1, parsePositiveInt(process.env.ARTICLES_DAILY_LIMIT, 100))),
  AI_MODEL: process.env.AI_MODEL || "openai/gpt-4.1-mini",
  // Groq model id (see console.groq.com/docs/models). Override with GROQ_MODEL.
  GROQ_MODEL: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  // Groq API key. Required for any LLM work (extraction, content).
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  // Optional legacy Tavily key; ignored in free mode.
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
  GROQ_TIMEOUT_MS: parsePositiveInt(process.env.GROQ_TIMEOUT_MS, 45_000),
  TAVILY_TIMEOUT_MS: parsePositiveInt(process.env.TAVILY_TIMEOUT_MS, 20_000),
  // Max web searches each researcher runs per pass. Keep this modest to limit
  // latency and provider usage; raise with RESEARCH_MAX_QUERIES.
  RESEARCH_MAX_QUERIES: parsePositiveInt(process.env.RESEARCH_MAX_QUERIES, process.env.GROQ_API_KEY ? 4 : 2),
};

export type ProviderKey = "groq" | "tavily" | "gateway" | "groq_search" | "articles";

export type WindowLimits = { daily: number; weekly: number; monthly: number };

/**
 * Application caps per provider, for each rolling window. A cap of 0 disables
 * that window. The automatic brake in usage.ts pauses runs when any enabled
 * window is reached. All are env-overridable, e.g. GROQ_DAILY_LIMIT or
 * TAVILY_MONTHLY_LIMIT.
 *
 * Defaults are conservative application guardrails. Provider quotas vary by
 * account, model and plan, so configure provider-side spend limits as well.
 */
export const USAGE_LIMITS: Record<ProviderKey, WindowLimits> = {
  articles: { daily: env.ARTICLES_DAILY_LIMIT, weekly: 0, monthly: 0 },
  groq_search: { daily: 200, weekly: 0, monthly: 0 },
  gateway: {
    daily: parsePositiveInt(process.env.AI_DAILY_CALL_LIMIT, 100),
    weekly: parsePositiveInt(process.env.AI_WEEKLY_CALL_LIMIT, 500),
    monthly: parsePositiveInt(process.env.AI_MONTHLY_CALL_LIMIT, 1500),
  },
  groq: {
    daily: parsePositiveInt(process.env.GROQ_DAILY_LIMIT, 500),
    weekly: parsePositiveInt(process.env.GROQ_WEEKLY_LIMIT, 3000),
    monthly: parsePositiveInt(process.env.GROQ_MONTHLY_LIMIT, 12000),
  },
  tavily: {
    daily: parsePositiveInt(process.env.TAVILY_DAILY_LIMIT, 200),
    weekly: parsePositiveInt(process.env.TAVILY_WEEKLY_LIMIT, 700),
    monthly: parsePositiveInt(process.env.TAVILY_MONTHLY_LIMIT, 900),
  },
};

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  articles: "Article excerpts admitted for analysis",
  groq_search: "Groq Compound (web search)",
  gateway: "AI Gateway (LLM)",
  groq: "Groq (LLM)",
  tavily: "Tavily (web search)",
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** LLM generation is available when a Groq API key is configured. */
export function hasAI() {
  return Boolean(env.GROQ_API_KEY) || (!env.FREE_ONLY && hasGateway());
}

export function hasGateway() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === "1");
}

export function aiProvider(): "groq" | "gateway" {
  return env.FREE_ONLY || env.GROQ_API_KEY ? "groq" : "gateway";
}

/** Web research is available when a Tavily API key is configured. */
export function hasSearch() {
  return env.FREE_ONLY ? Boolean(env.GROQ_API_KEY) : Boolean(env.GROQ_API_KEY || env.TAVILY_API_KEY) || hasGateway();
}
