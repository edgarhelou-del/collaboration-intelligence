import "server-only";
import { env, hasSearch } from "./env";
import { AgentDependencyError } from "./agents/errors";

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

/**
 * Thin wrapper over the Tavily search API (https://tavily.com), chosen
 * because it returns clean, LLM-ready snippets rather than raw HTML. Any
 * other provider can be swapped in behind this same function signature.
 */
export async function webSearch(query: string, opts?: { maxResults?: number }): Promise<SearchResult[]> {
  if (!hasSearch()) {
    throw new AgentDependencyError(
      "TAVILY_API_KEY is not configured. Set it in your environment to enable web research."
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: opts?.maxResults ?? 8,
        include_answer: false,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new AgentDependencyError(`Search request failed: ${message}`);
  }

  if (!response.ok) {
    throw new AgentDependencyError(`Search API returned ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results?: { title: string; url: string; content: string; published_date?: string }[];
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedDate: r.published_date,
  }));
}
