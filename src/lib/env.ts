import "server-only";

export const env = {
  // Vercel AI Gateway model id in `provider/model` form. Override with AI_MODEL.
  // Default is a model available on the AI Gateway free tier. Premium models
  // like anthropic/claude-sonnet-4.5 require paid Gateway credits.
  AI_MODEL: process.env.AI_MODEL || "openai/gpt-4.1-mini",
  // Ordered fallback models tried when the primary model is unavailable or
  // rate-limited (the AI Gateway free tier limits requests PER MODEL, so a
  // run can succeed by switching models). Cross-provider by default so a
  // per-provider limit can also be escaped. Override with AI_FALLBACK_MODELS
  // (comma-separated `provider/model` ids); set to empty to disable.
  AI_FALLBACK_MODELS: parseModelList(
    process.env.AI_FALLBACK_MODELS,
    ["openai/gpt-4o-mini", "google/gemini-2.5-flash"]
  ),
  // Optional: only needed for local dev outside Vercel/v0. On Vercel/v0 the
  // AI Gateway authenticates automatically via OIDC, so this stays empty.
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY ?? "",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
  // Hard cap on model calls per UTC day, to stay within the AI Gateway free
  // tier and never incur charges. Override with AI_DAILY_CALL_LIMIT. Set to 0
  // to disable the cap (only do this once you've added paid Gateway credits).
  AI_DAILY_CALL_LIMIT: parsePositiveInt(process.env.AI_DAILY_CALL_LIMIT, 100),
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseModelList(value: string | undefined, fallback: string[]): string[] {
  if (value === undefined) return fallback;
  const list = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // An explicitly empty value disables fallbacks; a set value overrides them.
  return list;
}

/**
 * The primary model followed by its fallbacks, de-duplicated. Callers try each
 * in order until one succeeds — this is what makes an agent run survive a
 * per-model free-tier rate limit instead of failing outright.
 */
export function getAiModels(): string[] {
  return Array.from(new Set([env.AI_MODEL, ...env.AI_FALLBACK_MODELS]));
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

export function hasSearch() {
  return Boolean(env.TAVILY_API_KEY);
}
