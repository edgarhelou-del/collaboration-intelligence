import "server-only";

export const env = {
  // Vercel AI Gateway model id in `provider/model` form. Override with AI_MODEL.
  AI_MODEL: process.env.AI_MODEL || "anthropic/claude-sonnet-4.5",
  // Optional: only needed for local dev outside Vercel/v0. On Vercel/v0 the
  // AI Gateway authenticates automatically via OIDC, so this stays empty.
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY ?? "",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
};

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
