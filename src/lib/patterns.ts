import "server-only";
import { prisma } from "./prisma";
import { generateText } from "./ai";
import { hasAI } from "./env";
import type { PainCategory } from "@prisma/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Canonical, reusable pattern themes. The Pain Researcher tends to coin a unique
 * hyper-specific slug for every signal, which prevents any aggregation (every
 * pattern ends up with a single signal). We map each free-form key to one of a
 * stable set of themes via keyword matching so related signals — even from
 * different runs, companies, and phrasings — accumulate into the same evolving
 * pattern, while still spanning a diverse set of themes.
 */
const THEME_RULES: { key: string; label: string; keywords: string[] }[] = [
  { key: "applied-improv-experiential-learning", label: "Applied improv & experiential learning", keywords: ["improv", "improvis", "theater", "theatre", "experiential", "playful", "play", "celebrating-failure", "workshop", "role-play", "simulation", "game"] },
  { key: "psychological-safety-gap", label: "Psychological safety gap", keywords: ["psychological-safety", "psychological", "speak-up", "speak up", "fear", "courage", "safe-to", "vulnerab", "mental-health"] },
  { key: "cross-functional-silos", label: "Cross-functional silos", keywords: ["silo", "cross-functional", "cross-team", "department", "handoff", "fragmentation"] },
  { key: "leadership-alignment-gap", label: "Leadership alignment gap", keywords: ["alignment", "aligned", "priorit", "accountab", "shared-goal", "shared-purpose", "kpi", "okr", "direction"] },
  { key: "knowledge-sharing-gaps", label: "Knowledge sharing gaps", keywords: ["knowledge", "hoard", "communities-of-practice", "documentation", "transparency", "information-sharing", "tribal"] },
  { key: "trust-erosion", label: "Trust erosion", keywords: ["trust", "distrust", "credibility", "betray", "psychological-contract"] },
  { key: "corporate-storytelling", label: "Corporate storytelling", keywords: ["storytelling", "story-telling", "narrative", "story-driven", "business-story", "brand-story"] },
  { key: "talking-circles-dialogue", label: "Talking circles & dialogue", keywords: ["talking-circle", "listening-circle", "council-circle", "sharing-circle", "word-circle", "circle-practice", "dialogue-circle", "circulo-de-palabra", "circle"] },
  { key: "communication-breakdown", label: "Communication breakdown", keywords: ["communication", "communicate", "written-communication", "meeting", "overcommunicat", "miscommunicat", "messaging"] },
  { key: "culture-transformation", label: "Culture transformation", keywords: ["culture", "cultural", "transformation", "engagement", "disengage", "belonging", "values", "nadella"] },
  { key: "leadership-development", label: "Leadership development", keywords: ["leadership-development", "leadership-education", "coaching", "manager-training", "develop-leaders", "leadership-program"] },
  { key: "human-ai-collaboration", label: "Human-AI collaboration", keywords: ["ai", "artificial-intelligence", "genai", "copilot", "automation", "capacity", "augment"] },
  { key: "hybrid-remote-coordination", label: "Hybrid & remote coordination", keywords: ["remote", "hybrid", "distributed", "coordinat", "async", "agility", "workforce-agility", "time-zone"] },
  { key: "team-rituals-cadence", label: "Team rituals & cadence", keywords: ["ritual", "rhythm", "cadence", "ceremony", "stand-up", "standup", "retro", "clarity", "role-clarity"] },
  { key: "change-management-friction", label: "Change management friction", keywords: ["change-management", "during-change", "restructur", "reorg", "adoption", "resistance"] },
];

// When keyword matching fails, fall back to a canonical theme derived from the
// painCategory enum — aligned to the SAME theme keys above so a signal never
// splits into a near-duplicate bucket (e.g. "silos" vs "cross-functional-silos").
const CATEGORY_THEME: Record<string, { key: string; label: string }> = {
  COLLABORATION: { key: "cross-functional-silos", label: "Cross-functional silos" },
  SILOS: { key: "cross-functional-silos", label: "Cross-functional silos" },
  COMMUNICATION: { key: "communication-breakdown", label: "Communication breakdown" },
  TRUST: { key: "trust-erosion", label: "Trust erosion" },
  ALIGNMENT: { key: "leadership-alignment-gap", label: "Leadership alignment gap" },
  KNOWLEDGE_SHARING: { key: "knowledge-sharing-gaps", label: "Knowledge sharing gaps" },
  CULTURE: { key: "culture-transformation", label: "Culture transformation" },
  LEADERSHIP: { key: "leadership-development", label: "Leadership development" },
  PSYCHOLOGICAL_SAFETY: { key: "psychological-safety-gap", label: "Psychological safety gap" },
  COORDINATION: { key: "hybrid-remote-coordination", label: "Hybrid & remote coordination" },
  HUMAN_AI_COLLABORATION: { key: "human-ai-collaboration", label: "Human-AI collaboration" },
  OTHER: { key: "other-collaboration-signals", label: "Other collaboration signals" },
};

/**
 * Map a free-form patternKey (and its painCategory as fallback) to a stable
 * canonical theme so signals aggregate. Returns { key, label }.
 */
function canonicalTheme(rawKey: string, painCategory: string): { key: string; label: string } {
  const hay = rawKey.toLowerCase().replace(/[\s_]+/g, "-");
  for (const rule of THEME_RULES) {
    if (rule.keywords.some((kw) => hay.includes(kw))) {
      return { key: rule.key, label: rule.label };
    }
  }
  return CATEGORY_THEME[painCategory] ?? { key: "other-collaboration-signals", label: "Other collaboration signals" };
}

function topN(values: (string | null)[], n: number): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Re-aggregates every Signal into Pattern rows, grouped by the fine-grained
 * `patternKey` the Pain Researcher assigns (e.g. "cross-functional-silos"),
 * which is what turns a pile of signals into a legible, evolving radar.
 */
export async function recomputePatterns(options?: { skipSynthesis?: boolean }): Promise<void> {
  const signals = await prisma.signal.findMany({
    select: {
      id: true,
      patternKey: true,
      patternLabel: true,
      painCategory: true,
      industry: true,
      country: true,
      role: true,
      overallScore: true,
      discoveredAt: true,
    },
  });

  const byKey = new Map<string, typeof signals>();
  const labelByKey = new Map<string, string>();
  for (const s of signals) {
    const { key, label } = canonicalTheme(s.patternKey, s.painCategory);
    const arr = byKey.get(key) ?? [];
    arr.push(s);
    byKey.set(key, arr);
    if (!labelByKey.has(key)) labelByKey.set(key, label);
  }

  const now = Date.now();

  // Phase 1 — aggregation only (pure DB, fast). Collect any patterns that need a
  // fresh AI synthesis so we can do that separately without blocking aggregation.
  const pendingSynthesis: {
    patternId: string;
    label: string;
    signalCount: number;
    growthRate: number;
    topIndustries: { name: string; count: number }[];
    topRoles: { name: string; count: number }[];
    samples: string[];
  }[] = [];

  for (const [key, group] of byKey) {
    const label = labelByKey.get(key) || group[group.length - 1].patternLabel || key;
    // Use the most common painCategory in the group as the pattern's category.
    const painCategory: PainCategory = topN(group.map((s) => s.painCategory), 1)[0]?.name as PainCategory ?? group[0].painCategory;

    const last30 = group.filter((s) => now - s.discoveredAt.getTime() <= THIRTY_DAYS_MS);
    const previous30 = group.filter(
      (s) => now - s.discoveredAt.getTime() > THIRTY_DAYS_MS && now - s.discoveredAt.getTime() <= 2 * THIRTY_DAYS_MS
    );

    const averageScore = group.reduce((sum, s) => sum + s.overallScore, 0) / group.length;
    const growthRate = (last30.length - previous30.length) / Math.max(previous30.length, 1);

    const representative = [...group]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map((s) => s.id);

    const firstAppearance = new Date(Math.min(...group.map((s) => s.discoveredAt.getTime())));
    const latestAppearance = new Date(Math.max(...group.map((s) => s.discoveredAt.getTime())));

    const existing = await prisma.pattern.findUnique({ where: { key } });

    const data = {
      label,
      painCategory,
      signalCount: group.length,
      last30Count: last30.length,
      previous30Count: previous30.length,
      growthRate,
      averageScore,
      topIndustries: topN(group.map((s) => s.industry), 3),
      topCountries: topN(group.map((s) => s.country), 3),
      topRoles: topN(group.map((s) => s.role), 3),
      representativeSignalIds: representative,
      firstAppearance,
      latestAppearance,
    };

    const pattern = await prisma.pattern.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });

    const shouldResynthesize = !existing || existing.signalCount !== group.length || !existing.aiSynthesis;
    if (shouldResynthesize) {
      pendingSynthesis.push({
        patternId: pattern.id,
        label,
        signalCount: group.length,
        growthRate,
        topIndustries: data.topIndustries,
        topRoles: data.topRoles,
        samples: group
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, 5)
          .map((s) => s.id),
      });
    }
  }

  // Remove stale patterns whose key no longer maps to any signal group (e.g. after
  // key canonicalization or if all a pattern's signals were removed).
  const liveKeys = [...byKey.keys()];
  await prisma.pattern.deleteMany({ where: { key: { notIn: liveKeys } } });

  // Phase 2 — best-effort AI synthesis. Never let this block or hang the
  // aggregation above: each call is time-boxed, and if the gateway is rate-limited
  // we stop early rather than stalling on every remaining pattern.
  if (options?.skipSynthesis || !hasAI()) return;

  for (const item of pendingSynthesis) {
    try {
      const synthesis = await withTimeout(
        synthesizePattern({
          label: item.label,
          signalCount: item.signalCount,
          growthRate: item.growthRate,
          topIndustries: item.topIndustries,
          topRoles: item.topRoles,
          samples: item.samples,
        }),
        15000
      );
      await prisma.pattern.update({
        where: { id: item.patternId },
        data: { aiSynthesis: synthesis, synthesizedAt: new Date() },
      });
    } catch {
      // If synthesis fails (rate limit, timeout), stop trying the rest this run —
      // aggregation is already persisted and synthesis will be retried next run.
      break;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function synthesizePattern(input: {
  label: string;
  signalCount: number;
  growthRate: number;
  topIndustries: { name: string; count: number }[];
  topRoles: { name: string; count: number }[];
  samples: string[];
}): Promise<string> {
  const sampleSignals = await prisma.signal.findMany({
    where: { id: { in: input.samples } },
    select: { painDescription: true, role: true, company_: true, industry: true },
  });

  const text = await generateText({
    system:
      "You write a short, precise analyst synthesis (3-5 sentences) of an emerging organizational " +
      "collaboration pattern, based only on the aggregated stats and example descriptions given. " +
      "Do not invent numbers beyond what is given. Write in a neutral, editorial tone suitable for " +
      "an executive briefing. Do not use headers or bullet points — plain prose only.",
    prompt: `PATTERN: ${input.label}
SIGNAL COUNT: ${input.signalCount}
GROWTH RATE (vs prior 30 days): ${(input.growthRate * 100).toFixed(0)}%
TOP INDUSTRIES: ${JSON.stringify(input.topIndustries)}
TOP ROLES: ${JSON.stringify(input.topRoles)}
EXAMPLE SIGNALS: ${JSON.stringify(sampleSignals)}

Write the synthesis now.`,
    maxTokens: 400,
  });

  return text.trim();
}
