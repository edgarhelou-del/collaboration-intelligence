import "server-only";

/**
 * Free-stack configuration.
 *
 * The app runs entirely on free tiers with NO Vercel AI Gateway credit:
 *   - LLM (extraction + content generation) → Groq (GROQ_API_KEY)
 *   - Web search                            → Tavily (TAVILY_API_KEY)
 *
 * Both providers have their own free quotas, so usage is metered per provider
 * across daily / weekly / monthly windows and hard-capped (see usage.ts) to
 * guarantee the app never spends money.
 */
export const env = {
  // Groq model id (see console.groq.com/docs/models). The default is a capable
  // model available on Groq's free tier. Override with GROQ_MODEL.
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  // Groq API key — create a free key at console.groq.com. Required for any LLM
  // work (extraction, content). No credit card needed.
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  // Tavily API key — free web-search tier at tavily.com. Required for research.
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
  // Max web searches each researcher runs per pass. Kept modest so a full run
  // sips the Tavily free tier; raise with RESEARCH_MAX_QUERIES.
  RESEARCH_MAX_QUERIES: parsePositiveInt(process.env.RESEARCH_MAX_QUERIES, 4),
};

export type ProviderKey = "groq" | "tavily";

export type WindowLimits = { daily: number; weekly: number; monthly: number };

/**
 * Free-tier-safe caps per provider, for each rolling window. A cap of 0
 * disables that window. The automatic brake in usage.ts pauses runs when ANY
 * enabled window for a provider is reached, so the app stays inside the free
 * tier. All are env-overridable, e.g. GROQ_DAILY_LIMIT, TAVILY_MONTHLY_LIMIT.
 *
 * Defaults sit comfortably under each provider's published free allowance:
 *   - Groq free tier is ~1,000 requests/day → daily 500 leaves wide margin.
 *   - Tavily free tier is ~1,000 credits/month → monthly 900 stays under it.
 */
export const USAGE_LIMITS: Record<ProviderKey, WindowLimits> = {
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
  return Boolean(env.GROQ_API_KEY);
}

/** Web research is available when a Tavily API key is configured. */
export function hasSearch() {
  return Boolean(env.TAVILY_API_KEY);
}
