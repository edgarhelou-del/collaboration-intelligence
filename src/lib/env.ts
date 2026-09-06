import "server-only";

export const env = {
  // Vercel AI Gateway model id in `provider/model` form. Override with AI_MODEL.
  // Default is a model available on the AI Gateway free tier. Premium models
  // like anthropic/claude-sonnet-4.5 require paid Gateway credits.
  AI_MODEL: process.env.AI_MODEL || "openai/gpt-4.1-mini",
  // Optional: only needed for local dev outside Vercel/v0. On Vercel/v0 the
  // AI Gateway authenticates automatically via OIDC, so this stays empty.
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY ?? "",
  // Gateway `provider/model` id used for live web search (Perplexity Sonar).
  SEARCH_MODEL: process.env.SEARCH_MODEL || "perplexity/sonar",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
  // Hard cap on model calls per UTC day, to stay within the AI Gateway free
  // tier and never incur charges. Override with AI_DAILY_CALL_LIMIT. Set to 0
  // to disable the cap (only do this once you've added paid Gateway credits).
  AI_DAILY_CALL_LIMIT: parsePositiveInt(process.env.AI_DAILY_CALL_LIMIT, 100),
  // Max web searches each researcher runs per pass. Web search now goes through
  // the AI Gateway (Perplexity Sonar), so every search is a model call. The
  // free tier is rate-limited per minute, so we keep this modest by default;
  // raise it with RESEARCH_MAX_QUERIES once paid Gateway credits are added.
  RESEARCH_MAX_QUERIES: parsePositiveInt(process.env.RESEARCH_MAX_QUERIES, 4),
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * AI generation goes through the Vercel AI Gateway, which is zero-config on
 * Vercel and in v0 previews (OIDC-based auth). It only needs an explicit key
 * when running locally outside that environment. We therefore treat AI as
 * available unless we're clearly running locally without a key.
 */
export function hasAI() {
  if (env.AI_GATEWAY_API_KEY) return true;
  // On Vercel (including preview/production) OIDC provides auth automatically.
  if (process.env.VERCEL) return true;
  // v0 preview / Vercel runtime also injects an OIDC token.
  if (process.env.VERCEL_OIDC_TOKEN) return true;
  return false;
}

/**
 * Web search now runs through the AI Gateway (Perplexity Sonar), so it is
 * available exactly when AI generation is — no separate search API key needed.
 */
export function hasSearch() {
  return hasAI();
}
