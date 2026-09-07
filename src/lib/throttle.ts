import "server-only";

/**
 * Creates an independent serializer that guarantees a minimum gap between the
 * calls routed through it. Each provider (Groq, Tavily) gets its own instance
 * so one provider's spacing never blocks the other, while still preventing the
 * bursts that trip free-tier per-minute limits.
 *
 * The gap is measured AFTER each call settles (not from its start), so a slow
 * call doesn't shorten the spacing to the next one.
 */
export function createThrottle(minSpacingMs: number) {
  let chain: Promise<void> = Promise.resolve();
  return async function throttle<T>(fn: () => Promise<T>): Promise<T> {
    const prior = chain;
    let release!: () => void;
    chain = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prior;
    try {
      return await fn();
    } finally {
      setTimeout(release, Math.max(0, minSpacingMs));
    }
  };
}
