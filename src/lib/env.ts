import "server-only";

export const env = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? "",
};

export function hasAI() {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function hasSearch() {
  return Boolean(env.TAVILY_API_KEY);
}
