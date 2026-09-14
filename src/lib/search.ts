import "server-only";
import { env, hasSearch } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { reserveCall } from "./usage";
import { createThrottle } from "./throttle";

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

/**
 * Live web search backed by Tavily's REST API. It is called directly, so web
 * research does not consume an LLM/Gateway call. Tavily returns source URLs
 * with short content snippets, which the researchers pass to the LLM.
 *
 * Uses "basic" search depth to limit provider usage. Each search counts
 * against the Tavily application meter (see usage.ts) and is spaced by its own
 * throttle.
 */
const TAVILY_ENDPOINT = "https://api.tavily.com/search";

const throttleTavily = createThrottle(
  Number.parseInt(process.env.TAVILY_MIN_SPACING_MS || "300", 10) || 300
);

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string | null;
};

export async function webSearch(
  query: string,
  opts?: { maxResults?: number; includeDomains?: string[] }
): Promise<SearchResult[]> {
  if (!hasSearch()) {
    throw new AgentDependencyError(
      "Web search is not configured. Add a Tavily API key as TAVILY_API_KEY."
    );
  }

  // Reserve against the application guardrails before making a provider call.
  await reserveCall("tavily");

  const maxResults = opts?.maxResults ?? 8;
  const body: Record<string, unknown> = {
    query,
    max_results: maxResults,
    search_depth: "basic",
    include_answer: false,
    include_raw_content: false,
  };
  if (opts?.includeDomains?.length) body.include_domains = opts.includeDomains;

  let data: { results?: TavilyResult[] };
  try {
    const res = await throttleTavily(() =>
      fetch(TAVILY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(env.TAVILY_TIMEOUT_MS),
      })
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) {
        throw new AgentDependencyError(
          "Tavily rate or credit limit reached. Web research is paused; verify the provider " +
            "quota and the usage panel in Settings before retrying."
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new AgentDependencyError(
          "Tavily rejected the API key. Check that TAVILY_API_KEY is valid."
        );
      }
      throw new AgentDependencyError(
        `Tavily search failed (HTTP ${res.status})${detail ? `: ${detail.slice(0, 160)}` : ""}.`
      );
    }

    data = (await res.json()) as { results?: TavilyResult[] };
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (/abort|timed?\s*out|timeout/i.test(message)) {
      throw new AgentDependencyError(
        `Tavily did not respond within ${Math.round(env.TAVILY_TIMEOUT_MS / 1000)} seconds. Retry the run shortly.`
      );
    }
    throw new AgentDependencyError(`Web search failed: ${message}`);
  }

  const results: SearchResult[] = (data.results ?? [])
    .filter((r): r is TavilyResult & { url: string } => typeof r?.url === "string" && r.url.length > 0)
    .map((r) => ({
      title: (r.title ?? r.url).trim(),
      url: r.url.trim(),
      content: (r.content ?? "").trim(),
      publishedDate: r.published_date ?? undefined,
    }));

  return results.slice(0, maxResults);
}
