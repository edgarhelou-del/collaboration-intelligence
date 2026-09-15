import { test } from "node:test";
import assert from "node:assert/strict";

test("missing free credentials cannot fall back to existing paid provider credentials", async () => {
  process.env.FREE_ONLY = "true";
  process.env.GROQ_API_KEY = "";
  process.env.AI_GATEWAY_API_KEY = "test-only-placeholder";
  process.env.TAVILY_API_KEY = "test-only-placeholder";
  const { hasAI, hasSearch } = await import("../src/lib/env");
  const { webSearch } = await import("../src/lib/search");
  const { generateText } = await import("../src/lib/ai");
  assert.equal(hasAI(), false);
  assert.equal(hasSearch(), false);
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error("Unexpected provider request"); };
  try {
    await assert.rejects(webSearch("team collaboration"), /Free mode requires GROQ_API_KEY/);
    await assert.rejects(generateText({ system: "Research", prompt: "Summarize" }), /Configure GROQ_API_KEY/);
    assert.equal(requests, 0);
  } finally { globalThis.fetch = original; }
});
