import "server-only";
import { env } from "./env";
import { AgentDependencyError } from "./agents/errors";
import { assertArticleCapacity, reserveArticleSlots, reserveCall } from "./usage";
import { createThrottle } from "./throttle";
import { parseGroqSearchResults } from "./groq-search-results";

const throttle = createThrottle(2500);

export async function groqSearch(query: string, opts?: { maxResults?: number; includeDomains?: string[] }) {
  if (!env.GROQ_API_KEY) throw new AgentDependencyError(
    "Free mode requires GROQ_API_KEY from a Groq Free account. No paid fallback is enabled."
  );
  await assertArticleCapacity();
  await reserveCall("groq_search");
  const response = await throttle(() => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.GROQ_API_KEY}` },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: "groq/compound-mini",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: `Use web_search to find recent published articles for: ${query}. Search the web even if you already know the topic. Give a brief answer with sources.` }],
      compound_custom: { tools: { enabled_tools: ["web_search"] } },
      ...(opts?.includeDomains?.length ? { search_settings: { include_domains: opts.includeDomains } } : {}),
    }),
  }));
  if (!response.ok) {
    await response.body?.cancel();
    throw new AgentDependencyError(response.status === 429
      ? "Groq Free search quota reached. Research is paused; retry after the provider resets its quota. No paid fallback was used."
      : `Groq web search failed (HTTP ${response.status}). Check the Free account and GROQ_API_KEY.`);
  }
  const results = parseGroqSearchResults(await response.json(), Math.min(4, opts?.maxResults ?? 4), opts?.includeDomains);
  if (!results.length) throw new AgentDependencyError("Groq returned no usable web-search excerpts. No generated claims were accepted as sources.");
  const granted = await reserveArticleSlots(results.length);
  if (!granted) throw new AgentDependencyError("Daily article limit reached. Research resumes after 00:00 UTC.");
  return results.slice(0, granted);
}
