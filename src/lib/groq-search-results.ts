import { z } from "zod";

export type ArticleExcerpt = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

const ResultSchema = z.object({
  title: z.string().min(1), url: z.string().url(), content: z.string().min(1),
  published_date: z.string().nullish(),
});
const ResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({
    executed_tools: z.array(z.object({
      search_results: z.object({ results: z.array(z.unknown()) }).nullish(),
    })).optional(),
  }) })),
});

/** Only raw provider search results count as evidence. Generated text is ignored. */
export function parseGroqSearchResults(
  data: unknown, maxResults: number, domains?: string[]
): ArticleExcerpt[] {
  const parsed = ResponseSchema.parse(data);
  const seen = new Set<string>();
  const results: ArticleExcerpt[] = [];
  for (const tool of parsed.choices[0]?.message.executed_tools ?? []) {
    for (const raw of tool.search_results?.results ?? []) {
      const entry = ResultSchema.safeParse(raw);
      if (!entry.success) continue;
      const r = entry.data;
      const url = new URL(r.url);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) continue;
      if (domains?.length && !domains.some(d => url.hostname === d || url.hostname.endsWith(`.${d}`))) continue;
      url.hash = "";
      const canonical = url.href;
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      results.push({ title: r.title, url: canonical, content: r.content.slice(0, 800),
        publishedDate: r.published_date && !Number.isNaN(Date.parse(r.published_date))
          ? new Date(r.published_date).toISOString() : undefined });
    }
  }
  return results.slice(0, Math.max(0, maxResults));
}
