import "server-only";
import { generateText as aiGenerateText } from "ai";
import { hasAI } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { extractJson } from "./ai";
import { reserveAiCall } from "./usage";

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

/**
 * Live web search backed by Perplexity's Sonar models through the Vercel AI
 * Gateway. Sonar performs a real-time web search and answers with grounded
 * citations, so results reflect currently-accessible pages rather than the
 * model's training data. Authentication is zero-config on Vercel/v0 (OIDC),
 * so no provider or search API key is required.
 *
 * The `provider/model` id can be overridden with SEARCH_MODEL (defaults to
 * `perplexity/sonar`, the cheapest Sonar tier). Any provider can be swapped in
 * behind this same function signature.
 */
const SEARCH_MODEL = process.env.SEARCH_MODEL || "perplexity/sonar";

/**
 * Global throttle. The AI Gateway free tier is rate-limited per minute, and a
 * single research run fires many searches (each is now a Gateway model call).
 * Firing them all at once instantly trips the limit, so we serialize searches
 * and leave a minimum gap between them; the SDK's own ret/backoff handles any
 * remaining pressure. Override the spacing with SEARCH_MIN_SPACING_MS.
 */
const MIN_SPACING_MS = Number.parseInt(process.env.SEARCH_MIN_SPACING_MS || "1200", 10) || 1200;
let searchChain: Promise<void> = Promise.resolve();

async function withThrottle<T>(fn: () => Promise<T>): Promise<T> {
  const prior = searchChain;
  let release!: () => void;
  searchChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prior;
  try {
    return await fn();
  } finally {
    setTimeout(release, MIN_SPACING_MS);
  }
}

type RawResult = {
  title?: string;
  url?: string;
  content?: string;
  publishedDate?: string | null;
};

export async function webSearch(
  query: string,
  opts?: { maxResults?: number; includeDomains?: string[] }
): Promise<SearchResult[]> {
  if (!hasAI()) {
    throw new AgentDependencyError(
      "Web search requires the AI Gateway. On Vercel/v0 it is zero-config; " +
        "locally, set AI_GATEWAY_API_KEY to enable web research."
    );
  }

  // A Sonar search is a model call, so it counts against the daily budget cap.
  await reserveAiCall();

  const maxResults = opts?.maxResults ?? 8;
  const domainHint = opts?.includeDomains?.length
    ? ` Strongly prefer sources from these domains: ${opts.includeDomains.join(", ")}.`
    : "";

  let text: string;
  let sources: { sourceType: string; url?: string; title?: string }[];
  try {
    const result = await withThrottle(() =>
      aiGenerateText({
        model: SEARCH_MODEL,
        maxOutputTokens: 2048,
        // Sonar is rate-limited per minute like other Gateway models; retry with
        // exponential backoff so a burst rides out the window instead of failing.
        maxRetries: 5,
        system:
          "You are a precise web research tool. Search the live web and return ONLY " +
          "factual results grounded in real, currently-accessible pages. Never invent " +
          "URLs, titles, or content. If nothing relevant is found, return an empty array.",
        prompt:
          `Search the web for: "${query}".\n\n` +
          `Return a JSON array of up to ${maxResults} of the most relevant results. ` +
          `Each item must be an object with exactly these keys:\n` +
          `- "title": the page title (string)\n` +
          `- "url": the real, full source URL (string)\n` +
          `- "content": a 2-4 sentence factual summary of what that page says about the query (string)\n` +
          `- "publishedDate": ISO 8601 date string, or null if unknown\n` +
          domainHint +
          `\n\nRespond with ONLY the JSON array. No prose, no markdown fences.`,
      })
    );
    text = result.text;
    sources = (result.sources ?? []) as typeof sources;
  } catch (err) {
    if (err instanceof AgentDependencyError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (/rate.?limit|429|too many requests/i.test(message)) {
      throw new AgentDependencyError(
        "The AI Gateway free tier is temporarily rate-limited. No changes were lost — " +
          "wait about a minute and run the agents again."
      );
    }
    throw new AgentDependencyError(`Web search failed: ${message}`);
  }

  // Primary path: parse the JSON the model was asked to produce.
  let parsed: RawResult[] = [];
  try {
    parsed = extractJson<RawResult[]>(text);
    if (!Array.isArray(parsed)) parsed = [];
  } catch {
    parsed = [];
  }

  let results: SearchResult[] = parsed
    .filter((r): r is RawResult & { url: string } => typeof r?.url === "string" && r.url.length > 0)
    .map((r) => ({
      title: (r.title ?? r.url).trim(),
      url: r.url.trim(),
      content: (r.content ?? "").trim(),
      publishedDate: r.publishedDate ?? undefined,
    }));

  // Fallback: if the model didn't return usable JSON, build results from the
  // grounded citations Sonar attached to its answer.
  if (results.length === 0 && sources.length > 0) {
    results = sources
      .filter((s) => s.sourceType === "url" && typeof s.url === "string")
      .map((s) => ({
        title: (s.title ?? s.url) as string,
        url: s.url as string,
        content: (s.title ?? "") as string,
      }));
  }

  return results.slice(0, maxResults);
}
