import "server-only";

export const env = {
  // Model is resolved through the Vercel AI Gateway (provider/model format).
  // No provider API key is required in v0 previews or Vercel deployments.
  AI_MODEL: process.env.AI_MODEL || "anthropic/claude-sonnet-4.5",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
};

export function hasAI() {
  // AI Gateway auth is zero-config in v0/Vercel, so generation is always available.
  return true;
}

export function hasSearch() {
  return Boolean(env.TAVILY_API_KEY);
}
