import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGroqSearchResults } from "../src/lib/groq-search-results";

const response = (results: unknown[]) => ({ choices: [{ message: {
  content: '[{"url":"https://invented.example/","content":"invented claim"}]',
  executed_tools: [{ search_results: { results } }],
} }] });
const article = { title: "Study", url: "https://research.example/study", content: "Observed study findings." };

test("accepts only raw search evidence, never generated answer URLs", () => {
  assert.deepEqual(parseGroqSearchResults({ choices: [{ message: { content: JSON.stringify(article) } }] }, 4), []);
  assert.equal(parseGroqSearchResults(response([article]), 4)[0].url, article.url);
});

test("filters unsafe URLs, malformed excerpts, duplicates and unrelated domains", () => {
  const results = parseGroqSearchResults(response([
    article, { ...article, url: `${article.url}#fragment` },
    { ...article, url: "javascript:alert(1)" },
    { ...article, url: "https://research.example.evil.test/study" },
    { ...article, url: "https://user:password@research.example/study" },
    { url: "https://research.example/missing-content" },
  ]), 4, ["research.example"]);
  assert.equal(results.length, 1);
});

test("limits excerpt size and count and does not invent publication dates", () => {
  const results = parseGroqSearchResults(response([
    { ...article, content: "x".repeat(1600), published_date: "unknown" },
    { ...article, url: "https://research.example/second" },
  ]), 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].content.length, 800);
  assert.equal(results[0].publishedDate, undefined);
});
