import "server-only";
import { env, hasSearch, hasGateway } from "./env";
import { generateText as aiGenerateText } from "ai";
import { extractJson, throttleGateway } from "./ai";
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

  if (!env.TAVILY_API_KEY) return gatewaySearch(query, opts);

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
      // Tavily reports exhausted plan quotas as 432 (in addition to 429).
      // Switch services without increasing or bypassing the Tavily quota.
      if ([429, 432, 433].includes(res.status) && hasGateway()) {
        await res.body?.cancel();
        return gatewaySearch(query, opts);
      }
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

async function gatewaySearch(
  query: string,
  opts?: { maxResults?: number; includeDomains?: string[] }
): Promise<SearchResult[]> {
  await reserveCall("gateway");
  const result = await throttleGateway(() => aiGenerateText({
    model: "perplexity/sonar",
    maxOutputTokens: 2048,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(45_000),
    system: "Search the live web. Return only factual source-specific summaries backed by your citations. Never invent people, quotes or URLs. Return JSON only.",
    prompt: `Search: ${query}\nReturn a JSON array of up to ${opts?.maxResults ?? 8} results with title, url, content (a short source-specific paraphrase, not a quotation), and publishedDate (ISO date or null). ${opts?.includeDomains?.length ? `Only use these domains: ${opts.includeDomains.join(", ")}.` : ""}`,
  }));
  const cited = new Set(result.sources.filter(s => s.sourceType === "url").map(s => s.url));
  const parsed: unknown = extractJson(result.text);
  if (!Array.isArray(parsed)) throw new AgentDependencyError("Search returned invalid structured results.");
  // Accept only URLs independently attached by the search provider. A URL
  // merely written in generated JSON is not enough to count as a source.
  return parsed.filter((r): r is SearchResult => {
    if (!r || typeof r.url !== "string" || typeof r.content !== "string" || typeof r.title !== "string" || !cited.has(r.url)) return false;
    if (!opts?.includeDomains?.length) return true;
    try {
      const host = new URL(r.url).hostname;
      return opts.includeDomains.some(d => host === d || host.endsWith(`.${d}`));
    } catch { return false; }
  }).map(r => ({title: r.title, url: r.url, content: `Search-provider paraphrase (not a verbatim quote): ${r.content}`, publishedDate: r.publishedDate || undefined})).slice(0, opts?.maxResults ?? 8);
}
