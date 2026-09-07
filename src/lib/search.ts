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
 * Live web search backed by Tavily's REST API (tavily.com), which has its own
 * free tier — so web research no longer consumes any LLM/Gateway credit. Tavily
 * returns real, currently-accessible pages with short content snippets, which
 * the researchers then pass to the LLM for extraction.
 *
 * Uses "basic" search depth (1 credit/search) rather than "advanced"
 * (2 credits) to stretch the free tier. Each search counts against the Tavily
 * budget meter (see usage.ts) and is spaced by its own throttle.
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
      "Web search is not configured. Add a free Tavily API key (TAVILY_API_KEY) from tavily.com " +
        "to enable web research."
    );
  }

  // Enforce the Tavily free-tier budget BEFORE spending a search credit.
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
      })
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) {
        throw new AgentDependencyError(
          "Tavily rate/credit limit reached. Web research is paused to stay within the free " +
            "tier; it resets automatically. See the usage panel in Settings."
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new AgentDependencyError(
          "Tavily rejected the API key. Check that TAVILY_API_KEY is a valid free key from tavily.com."
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
