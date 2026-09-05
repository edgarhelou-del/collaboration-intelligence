import "server-only";
import { z } from "zod";
import { prisma } from "../prisma";
import { generateJSON } from "../ai";
import { webSearch, type SearchResult } from "../search";
import { hasSearch } from "../env";
import { jaccardSimilarity } from "../dedupe";
import {
  bioEvidenceScore,
  bioRelevanceScore,
  bioActionabilityScore,
  bioRecencyScore,
  bioOverallScore,
} from "../bioScoring";
import { AgentDependencyError } from "./errors";
import { recomputeBioPatterns } from "../bioPatterns";
import type { BioCategory, BioLevel, SourceType } from "@prisma/client";

const BIO_CATEGORIES: BioCategory[] = [
  "CHANGE_READINESS",
  "CHANGE_FATIGUE",
  "RESILIENCE",
  "LEARNING_AGILITY",
  "REORGANIZATION",
  "TRANSFORMATION_ADOPTION",
  "LEADERSHIP_OF_CHANGE",
  "TEAM_ADAPTABILITY",
  "CULTURE_SHIFT",
  "AI_ADOPTION",
  "IDENTITY_AND_MEANING",
];

const VALID_BIO_CATEGORIES = new Set<string>([...BIO_CATEGORIES, "OTHER"]);
const VALID_LEVELS = new Set<string>(["INDIVIDUAL", "TEAM", "ORGANIZATION"]);

// Each category holds several angle phrases so a run spans the full spectrum of
// organizational adaptation to change. Deliberately broad: unlike the Pain
// Researcher, these do NOT force a named person — studies, surveys and reports
// qualify, which is what lets the agent actually capture material.
const QUERY_TOPICS: Record<BioCategory, string[]> = {
  CHANGE_READINESS: [
    "organizational change readiness study",
    "how ready are employees for change survey",
    "assessing readiness for transformation",
  ],
  CHANGE_FATIGUE: [
    "change fatigue employees research",
    "change saturation too much change workplace",
    "initiative overload burnout transformation",
  ],
  RESILIENCE: [
    "organizational resilience during change study",
    "building workforce resilience research",
    "team resilience adapting to disruption",
  ],
  LEARNING_AGILITY: [
    "learning agility reskilling workforce research",
    "upskilling employees for change study",
    "adaptive capability building organizations",
  ],
  REORGANIZATION: [
    "adapting to reorganization employees",
    "surviving restructuring how teams adapt",
    "post merger integration people adaptation",
  ],
  TRANSFORMATION_ADOPTION: [
    "digital transformation adoption employees study",
    "why transformations fail change adoption research",
    "technology rollout user adoption organization",
  ],
  LEADERSHIP_OF_CHANGE: [
    "leading change management research",
    "how leaders drive change adoption study",
    "change leadership best practices report",
  ],
  TEAM_ADAPTABILITY: [
    "team adaptability agility research",
    "how teams adapt to change study",
    "adaptive teams performance during change",
  ],
  CULTURE_SHIFT: [
    "culture change transformation study",
    "shifting mindset organizational change research",
    "behavior change at scale organizations",
  ],
  AI_ADOPTION: [
    "employees adapting to AI at work study",
    "AI adoption workforce change research",
    "how organizations adapt to generative AI",
  ],
  IDENTITY_AND_MEANING: [
    "employee identity during organizational change",
    "sensemaking meaning during transformation research",
    "loss and grief in organizational change study",
  ],
  OTHER: [
    "organizational adaptation to change research",
    "future of work adaptability study",
    "adapting to disruption workforce report",
  ],
};

// Level-oriented query banks. The organization level was already well covered
// by the category topics above, so INDIVIDUAL and TEAM get dedicated phrasing:
//   - INDIVIDUAL leans into how PEOPLE learn and UNLEARN, personal mindset
//     shifts and reskilling as they adapt to change.
//   - TEAM leans into what TEAM COACHING / team development experts observe
//     about how teams adapt, so the results surface practitioner insight rather
//     than macro corporate reports.
const LEVEL_TOPICS: Record<BioLevel, string[]> = {
  INDIVIDUAL: [
    "learning and unlearning at work",
    "how professionals unlearn old habits to adapt",
    "unlearning mindset to adapt to change",
    "personal adaptability learning new skills change",
    "reskilling and growth mindset for individuals",
    "how people adapt personally to organizational change",
    "cognitive flexibility adapting to new ways of working",
    "letting go of expertise to relearn at work",
  ],
  TEAM: [
    "team coaching how teams adapt to change",
    "team coach expert on team adaptability",
    "systemic team coaching through change",
    "team coaching research adapting teams",
    "team development coach navigating change",
    "high performing teams coaching change",
    "team coaching psychological safety during change",
    "agile team coaching adapting to disruption",
  ],
  // Organization keeps the full breadth of the category topics so the level
  // that was working stays comprehensive.
  ORGANIZATION: Object.values(QUERY_TOPICS).flat(),
};

// Broad, natural query templates. Both problem-oriented and study-oriented, so
// the results include surveys/reports (RESEARCH) and named practitioners
// (ATTRIBUTED). No rigid quoted phrases — those rarely match real pages.
const QUERY_TEMPLATES = [
  (topic: string) => `${topic}`,
  (topic: string) => `${topic} report 2025`,
  (topic: string) => `new research on ${topic}`,
  (topic: string) => `${topic} case study`,
  (topic: string) => `${topic} findings survey`,
  (topic: string) => `expert on ${topic}`,
];

function pickPhrase(level: BioLevel): string {
  const phrases = LEVEL_TOPICS[level];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Guarantee balanced coverage across the three system levels. INDIVIDUAL and
// TEAM are intentionally weighted higher because those were being missed, while
// ORGANIZATION keeps a couple of slots since it was already capturing well.
function pickQueries(): string[] {
  const plan: BioLevel[] = [
    "INDIVIDUAL",
    "INDIVIDUAL",
    "INDIVIDUAL",
    "INDIVIDUAL",
    "TEAM",
    "TEAM",
    "TEAM",
    "TEAM",
    "ORGANIZATION",
    "ORGANIZATION",
  ];
  const queries = new Set<string>();
  plan.forEach((level, i) => {
    const template = QUERY_TEMPLATES[i % QUERY_TEMPLATES.length];
    queries.add(template(pickPhrase(level)));
  });
  return [...queries];
}

const CandidateSchema = z.object({
  findingType: z.enum(["ATTRIBUTED", "RESEARCH"]),
  level: z.enum(["INDIVIDUAL", "TEAM", "ORGANIZATION"]),
  category: z.enum([
    "CHANGE_READINESS",
    "CHANGE_FATIGUE",
    "RESILIENCE",
    "LEARNING_AGILITY",
    "REORGANIZATION",
    "TRANSFORMATION_ADOPTION",
    "LEADERSHIP_OF_CHANGE",
    "TEAM_ADAPTABILITY",
    "CULTURE_SHIFT",
    "AI_ADOPTION",
    "IDENTITY_AND_MEANING",
    "OTHER",
  ]),
  patternKey: z.string(),
  patternLabel: z.string(),
  title: z.string(),
  summary: z.string(),
  evidence: z.string(),
  isParaphrase: z.boolean(),
  personName: z.string().nullable(),
  role: z.string().nullable(),
  company: z.string().nullable(),
  industry: z.string().nullable(),
  country: z.string().nullable(),
  sourceUrl: z.string(),
  sourceName: z.string().nullable(),
  sourceDate: z.string().nullable(),
  confidence01: z.number().min(0).max(1),
  relevance01: z.number().min(0).max(1),
  actionability01: z.number().min(0).max(1),
  whyItMatters: z.string(),
  implication: z.string(),
});

type Candidate = z.infer<typeof CandidateSchema>;

// The model occasionally invents an out-of-range enum. Coerce unknowns to safe
// defaults so one bad field doesn't discard an otherwise-valid finding.
function normalizeCandidate(item: unknown): unknown {
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const next = { ...obj };
    if (typeof obj.category === "string" && !VALID_BIO_CATEGORIES.has(obj.category)) {
      next.category = "OTHER";
    }
    if (typeof obj.level === "string" && !VALID_LEVELS.has(obj.level)) {
      next.level = "ORGANIZATION";
    }
    return next;
  }
  return item;
}

const SYSTEM_PROMPT = `You are the Bioadaptability Researcher for KOLAB. "Bioadaptability" here means
organizational ADAPTATION TO CHANGE: how individuals, teams and whole organizations sense, absorb,
resist and evolve through change — reorganizations, transformations, new technology and AI adoption,
culture shifts, disruption, reskilling, resilience and change fatigue.

You are given snippets of real, publicly available web content (search results). Extract FINDINGS
about how people, teams and organizations are adapting (or failing to adapt) to change. A finding is
EITHER:
  (a) ATTRIBUTED — a real, named person at a named organization describing an adaptation dynamic,
      practice, or struggle, OR
  (b) RESEARCH — a study, survey, report, dataset, meta-analysis or clearly-sourced expert finding
      about adaptation to change, WITHOUT requiring a named individual subject.

CRITICAL RULES:
- Attribution is OPTIONAL. RESEARCH findings are just as valuable as ATTRIBUTED ones. Do NOT skip a
  strong study merely because no individual is named. For RESEARCH findings, set personName/role/
  company to null and put the publisher/institution in sourceName.
- Still require REAL evidence tied to the snippet: an actual stated observation, statistic, quote, or
  concrete described practice about adaptation to change. Never invent statistics, studies or quotes.
- Never fabricate a quote. If the snippet gives exact words, you may quote them verbatim and set
  isParaphrase=false. Otherwise write a faithful paraphrase and set isParaphrase=true.
- "level" is the primary system level the dynamic operates at: INDIVIDUAL, TEAM, or ORGANIZATION.
  Actively capture findings at ALL THREE levels — do not default everything to ORGANIZATION:
    * INDIVIDUAL: how a PERSON adapts — especially LEARNING and UNLEARNING (letting go of old
      habits, skills or expertise to relearn), mindset shifts, cognitive flexibility, personal
      reskilling and how individuals cope with change. When a snippet describes what people do to
      unlearn/relearn, capture it as INDIVIDUAL.
    * TEAM: how a TEAM adapts — prioritize insight from TEAM COACHING and team-development experts
      (team coaches, facilitators, practitioners) on how teams build adaptability, psychological
      safety, and navigate change together. Named coaches/practitioners here are ATTRIBUTED findings;
      studies about team adaptation are RESEARCH.
    * ORGANIZATION: enterprise/system-wide adaptation.
- If a snippet contains nothing about adaptation to change, skip it. Returning an empty array is
  correct when nothing qualifies. But do not be overly strict — adaptation-to-change material is
  common in these snippets, so capture what genuinely qualifies.
- patternKey must be a STABLE, REUSABLE theme-level kebab-case slug shared by many future findings
  (e.g. "change-fatigue-burnout", "ai-adoption-adaptation", "resilience-building",
  "learning-agility-reskilling", "reorg-restructuring", "leadership-of-change", "culture-shift").
  Do NOT encode company names, person names or one-off specifics into patternKey.
- If an EXISTING PATTERNS list is provided above, reuse the exact patternKey + patternLabel verbatim
  when a finding fits one of those themes; only coin a new key for a genuinely distinct theme.

Respond with ONLY a JSON array, no commentary, where each element matches:
{
  "findingType": "ATTRIBUTED"|"RESEARCH",
  "level": "INDIVIDUAL"|"TEAM"|"ORGANIZATION",
  "category": one of the categories above (SCREAMING_SNAKE_CASE),
  "patternKey": string, "patternLabel": string,
  "title": string, "summary": string, "evidence": string, "isParaphrase": boolean,
  "personName": string|null, "role": string|null, "company": string|null,
  "industry": string|null, "country": string|null,
  "sourceUrl": string, "sourceName": string|null, "sourceDate": string|null (ISO date if known),
  "confidence01": number, "relevance01": number, "actionability01": number,
  "whyItMatters": string, "implication": string
}`;

export async function runBioAdaptability(agentRunId: string): Promise<{
  savedCount: number;
  skippedDuplicates: number;
  warnings: string[];
}> {
  if (!hasSearch()) {
    throw new AgentDependencyError(
      "TAVILY_API_KEY is not configured. The Bioadaptability Researcher requires live web search and will not fabricate findings without it."
    );
  }

  const warnings: string[] = [];
  const queries = pickQueries();
  const allResults: (SearchResult & { query: string })[] = [];

  // Run searches concurrently (independent, no AI Gateway involved) so 10
  // advanced queries collapse to ~2s instead of ~20s and never blow the timeout.
  const searches = await Promise.allSettled(queries.map((query) => webSearch(query, { maxResults: 8 })));
  searches.forEach((settled, i) => {
    const query = queries[i];
    if (settled.status === "fulfilled") {
      settled.value.forEach((r) => allResults.push({ ...r, query }));
    } else {
      const reason = settled.reason;
      warnings.push(`Search failed for "${query}": ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  });

  if (allResults.length === 0) {
    throw new AgentDependencyError(
      `All web searches failed this run. No unsupported findings were generated. Details: ${warnings.join("; ") || "no results returned"}`
    );
  }

  const seen = new Set<string>();
  const deduped = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const existingPatterns = await prisma.bioPattern.findMany({
    select: { key: true, label: true, category: true, findingCount: true },
    orderBy: { findingCount: "desc" },
    take: 40,
  });
  const patternVocab =
    existingPatterns.length > 0
      ? `EXISTING PATTERNS (reuse the exact patternKey + patternLabel when a finding fits one of these; only coin a NEW kebab-case key for a genuinely distinct theme):\n${JSON.stringify(
          existingPatterns.map((p) => ({ patternKey: p.key, patternLabel: p.label, category: p.category })),
          null,
          2
        )}\n\n`
      : "";

  const batchPrompt = `${patternVocab}SEARCH RESULTS TO ANALYZE:\n${JSON.stringify(
    deduped.map((r) => ({ title: r.title, url: r.url, content: r.content.slice(0, 1500), publishedDate: r.publishedDate })),
    null,
    2
  )}\n\nExtract qualifying adaptation findings now. Aim for up to 10 distinct, high-quality findings if the snippets support them — mixing RESEARCH and ATTRIBUTED as the material allows. Never fabricate or pad; return fewer (or an empty array) only if the material genuinely does not qualify.`;

  const candidates: Candidate[] = [];
  try {
    const raw = await generateJSON<unknown[]>({ system: SYSTEM_PROMPT, prompt: batchPrompt, maxTokens: 8192 });
    const rawArray = Array.isArray(raw) ? raw : [];
    for (const item of rawArray) {
      const parsed = CandidateSchema.safeParse(normalizeCandidate(item));
      if (parsed.success) {
        candidates.push(parsed.data);
      } else {
        warnings.push(`Skipped a malformed candidate: ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
      }
    }
    if (candidates.length === 0 && rawArray.length === 0 && warnings.length === 0) {
      warnings.push("No qualifying adaptation findings found in this run's search results.");
    }
  } catch (err) {
    throw new AgentDependencyError(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  let savedCount = 0;
  let skippedDuplicates = 0;

  for (const c of candidates) {
    if (await isDuplicateFinding(c)) {
      skippedDuplicates++;
      continue;
    }

    const sourceDate = c.sourceDate ? safeDate(c.sourceDate) : null;

    const evidence = bioEvidenceScore(c.findingType, c.confidence01);
    const relevance = bioRelevanceScore(c.relevance01);
    const actionability = bioActionabilityScore(c.actionability01);
    const recency = bioRecencyScore(sourceDate);
    const overall = bioOverallScore({
      evidenceScore: evidence,
      relevanceScore: relevance,
      actionabilityScore: actionability,
      recencyScore: recency,
    });

    await prisma.bioFinding.create({
      data: {
        agentRunId,
        findingType: c.findingType,
        level: c.level as BioLevel,
        category: c.category as BioCategory,
        patternKey: c.patternKey,
        patternLabel: c.patternLabel,
        title: c.title,
        summary: c.summary,
        evidence: c.evidence,
        isParaphrase: c.isParaphrase,
        personName: c.personName,
        role: c.role,
        company: c.company,
        industry: c.industry,
        country: c.country,
        sourceUrl: c.sourceUrl,
        sourceName: c.sourceName,
        sourceType: inferSourceType(c.sourceUrl),
        sourceDate,
        evidenceScore: evidence,
        relevanceScore: relevance,
        actionabilityScore: actionability,
        recencyScore: recency,
        overallScore: overall,
        whyItMatters: c.whyItMatters,
        implication: c.implication,
      },
    });
    savedCount++;
  }

  // Aggregate immediately, skipping per-pattern AI synthesis here to avoid
  // bursting past the AI Gateway per-minute rate limit right after extraction.
  await recomputeBioPatterns({ skipSynthesis: true });

  return { savedCount, skippedDuplicates, warnings };
}

/** True if a finding for this source URL already exists, or a very similar
 * title/summary was already captured (guards against re-saving the same study
 * surfaced under a slightly different URL). */
async function isDuplicateFinding(c: Candidate): Promise<boolean> {
  const bySource = await prisma.bioFinding.findFirst({ where: { sourceUrl: c.sourceUrl } });
  if (bySource) return true;

  const recent = await prisma.bioFinding.findMany({
    orderBy: { discoveredAt: "desc" },
    take: 60,
    select: { title: true, patternKey: true },
  });
  return recent.some(
    (r) => r.patternKey === c.patternKey && jaccardSimilarity(r.title, c.title) > 0.6
  );
}

function safeDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inferSourceType(url: string): SourceType {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "LINKEDIN";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YOUTUBE";
  if (u.includes("reddit.com")) return "REDDIT";
  return "OTHER";
}
