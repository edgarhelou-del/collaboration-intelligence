import "server-only";

/**
 * ONE global throttle for every Vercel AI Gateway call in the app — model
 * generation (ai.ts) AND web search (search.ts) alike.
 *
 * Why this exists: the Gateway free tier is rate-limited per minute. Previously
 * only web search was throttled, and even that fired its queries concurrently,
 * while the extraction and Content Agent calls went out with no spacing at all.
 * A single "Run all" therefore bursted ~11 Gateway calls within a few seconds
 * and the free tier rejected most of them (429) — which is why research runs
 * kept failing with "temporarily rate-limited" and brought in no new signals.
 *
 * Routing every Gateway call through this serializer guarantees a minimum gap
 * between calls across the whole process, keeping us under the per-minute limit
 * so calls actually succeed instead of being retried into failure. Tune the gap
 * with AI_GATEWAY_MIN_SPACING_MS (raise it if you still see 429s; lower it once
 * you add paid Gateway credits).
 */
const MIN_SPACING_MS = Number.parseInt(process.env.AI_GATEWAY_MIN_SPACING_MS || "3000", 10) || 3000;

let chain: Promise<void> = Promise.resolve();

export async function throttleGateway<T>(fn: () => Promise<T>): Promise<T> {
  const prior = chain;
  let release!: () => void;
  chain = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prior;
  try {
    return await fn();
  } finally {
    // Hold the next caller off for the spacing window AFTER this call settles,
    // so the gap is measured between call completions, not their starts.
    setTimeout(release, MIN_SPACING_MS);
  }
}
