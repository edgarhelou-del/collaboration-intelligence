import "server-only";
import { z } from "zod";
import { prisma } from "../prisma";
import { generateJSON } from "../ai";
import { webSearch, type SearchResult } from "../search";
import { hasSearch } from "../env";
import { isDuplicateSignal } from "../dedupe";
import {
  evidenceScore,
  organizationalRelevanceScore,
  recencyScore as recencyScoreOf,
  commercialRelevanceScore,
  overallScore,
  seniorityScoreFromLevel,
  type SeniorityLevel,
} from "../scoring";
import { AgentDependencyError } from "./errors";
import { recomputePatterns } from "../patterns";
import type { PainCategory, SourceType } from "@prisma/client";

const PAIN_CATEGORIES: PainCategory[] = [
  "COLLABORATION",
  "SILOS",
  "COMMUNICATION",
  "TRUST",
  "ALIGNMENT",
  "KNOWLEDGE_SHARING",
  "CULTURE",
  "LEADERSHIP",
  "PSYCHOLOGICAL_SAFETY",
  "COORDINATION",
  "HUMAN_AI_COLLABORATION",
];

const ROLE_TERMS = ["CEO", "founder", "CHRO", "COO", "CIO", "CTO", "CPO", "VP", "director"];

// Each category holds several angle phrases so a run spans the full spectrum of
// collaboration signals — problems AND experimental approaches (corporate
// theater, applied improv, collective intelligence, team-building rituals) that
// reveal how organizations are working on human collaboration.
const QUERY_TOPICS: Record<PainCategory, string[]> = {
  COLLABORATION: [
    "cross-team collaboration problems",
    "collective intelligence at work",
    "teamwork and collaboration experiments company",
    "collaborative culture initiative results",
  ],
  SILOS: [
    "organizational silos breaking down teams",
    "breaking departmental silos program",
    "cross-functional collaboration to end silos",
  ],
  COMMUNICATION: [
    "communication breakdown between teams",
    "improving workplace communication experiment",
    "storytelling to improve team communication",
    "corporate storytelling to align employees",
    "business storytelling workshop for teams",
    "leaders using narrative to connect teams",
  ],
  TRUST: [
    "lack of trust between teams leadership",
    "building trust in teams program",
    "vulnerability based trust leadership team",
  ],
  ALIGNMENT: [
    "teams not aligned on priorities",
    "aligning teams on shared goals initiative",
    "creating shared purpose across teams",
  ],
  KNOWLEDGE_SHARING: [
    "knowledge hoarding lack of knowledge sharing",
    "knowledge sharing culture experiment",
    "communities of practice knowledge sharing",
  ],
  CULTURE: [
    "toxic culture employees disengaged",
    "corporate theater to teach soft skills",
    "applied improv training for teams",
    "experiential learning workshops company culture",
    "team building rituals that changed culture",
    "talking circles at work team dialogue",
    "listening circles workplace psychological safety",
    "council circle practice team meetings",
    "sharing circle employees open dialogue",
  ],
  LEADERSHIP: [
    "leadership challenges managing distributed teams",
    "leadership development experiential program",
    "coaching leaders on collaboration skills",
  ],
  PSYCHOLOGICAL_SAFETY: [
    "psychological safety employees afraid to speak up",
    "building psychological safety program results",
    "psychological safety experiment team performance",
  ],
  COORDINATION: [
    "coordination problems between departments",
    "coordinating hybrid remote teams experiment",
    "rituals to coordinate cross-functional work",
  ],
  HUMAN_AI_COLLABORATION: [
    "employees struggling to collaborate with AI tools",
    "human AI collaboration teamwork experiment",
    "teams learning to work alongside AI agents",
  ],
  OTHER: [
    "organizational collaboration problems",
    "future of work collaboration experiment",
    "innovative approach to teamwork and soft skills",
  ],
};

// Two families of templates: problem-oriented (surface named people describing
// pains) and experiment-oriented (surface case studies / practitioners running
// novel collaboration programs). Both aim for pages with a NAMED person and
// company. Rigid quoted phrases are avoided since they rarely match real pages.
const QUERY_TEMPLATES = [
  (role: string, topic: string) => `${role} interview says ${topic}`,
  (role: string, topic: string) => `${role} on ${topic} "we struggle"`,
  (_role: string, topic: string) => `executive quote ${topic} challenge`,
  (role: string, topic: string) => `${role} admits ${topic}`,
  (_role: string, topic: string) => `leaders describe ${topic} their company`,
  (_role: string, topic: string) => `case study ${topic}`,
  (_role: string, topic: string) => `how company used ${topic}`,
  (role: string, topic: string) => `${role} explains ${topic} at their company`,
];

function pickPhrase(cat: PainCategory): string {
  const phrases = QUERY_TOPICS[cat];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function pickQueries(n: number): string[] {
  // Rotate through all categories (shuffled) so a run spans many collaboration
  // themes, picking a random angle phrase for each to widen subject coverage.
  const cats = [...PAIN_CATEGORIES].sort(() => Math.random() - 0.5);
  const queries: string[] = [];
  for (let i = 0; i < n; i++) {
    const cat = cats[i % cats.length];
    const role = ROLE_TERMS[Math.floor(Math.random() * ROLE_TERMS.length)];
    const template = QUERY_TEMPLATES[i % QUERY_TEMPLATES.length];
    queries.push(template(role, pickPhrase(cat)));
  }
  return queries;
}

const CandidateSchema = z.object({
  personName: z.string(),
  role: z.string(),
  seniorityLevel: z.enum(["C_LEVEL", "VP", "DIRECTOR", "MANAGER", "OTHER"]),
  company: z.string(),
  industry: z.string().nullable(),
  country: z.string().nullable(),
  companySize: z.string().nullable(),
  painCategory: z.enum([
    "COLLABORATION",
    "SILOS",
    "COMMUNICATION",
    "TRUST",
    "ALIGNMENT",
    "KNOWLEDGE_SHARING",
    "CULTURE",
    "LEADERSHIP",
    "PSYCHOLOGICAL_SAFETY",
    "COORDINATION",
    "HUMAN_AI_COLLABORATION",
    "OTHER",
  ]),
  patternKey: z.string(),
  patternLabel: z.string(),
  painDescription: z.string(),
  evidence: z.string(),
  isParaphrase: z.boolean(),
  evidenceType: z.enum(["DIRECT", "INDIRECT"]),
  sourceUrl: z.string(),
  sourceName: z.string().nullable(),
  sourceDate: z.string().nullable(),
  confidence01: z.number().min(0).max(1),
  organizationalRelevance01: z.number().min(0).max(1),
  commercialRelevance01: z.number().min(0).max(1),
  whyItMatters: z.string(),
  underlyingIssue: z.string(),
  commercialRelevanceNote: z.string(),
});

type Candidate = z.infer<typeof CandidateSchema>;

const VALID_PAIN_CATEGORIES = new Set<string>([
  "COLLABORATION", "SILOS", "COMMUNICATION", "TRUST", "ALIGNMENT", "KNOWLEDGE_SHARING",
  "CULTURE", "LEADERSHIP", "PSYCHOLOGICAL_SAFETY", "COORDINATION", "HUMAN_AI_COLLABORATION", "OTHER",
]);

// The model occasionally invents a category (e.g. "LEADERSHIP_ALIGNMENT").
// Map any unknown value to OTHER so the candidate survives validation instead
// of taking the whole batch down with it.
function normalizeCandidate(item: unknown): unknown {
  if (item && typeof item === "object" && "painCategory" in item) {
    const cat = (item as { painCategory: unknown }).painCategory;
    if (typeof cat === "string" && !VALID_PAIN_CATEGORIES.has(cat)) {
      return { ...item, painCategory: "OTHER" };
    }
  }
  return item;
}

const SYSTEM_PROMPT = `You are the Collaboration Intelligence Researcher for KOLAB. You are given
snippets of real, publicly available web content (search results). Your job is to extract SIGNALS
about the state of human collaboration inside organizations. A signal is a real, named person at a
real, named company who is EITHER:
  (a) publicly expressing a real professional problem related to human collaboration, OR
  (b) publicly describing a notable practice, program or EXPERIMENT aimed at improving collaboration
      — e.g. corporate theater / applied improv to teach soft skills, psychological-safety programs,
      collective-intelligence or teamwork rituals, cross-functional initiatives, human-AI teaming.

Relevant themes include: collaboration, teamwork, collective intelligence, silos, communication,
trust, alignment, knowledge sharing, culture, leadership, psychological safety, coordination,
human-AI collaboration, and experiential learning approaches to soft skills.

For an experiment/practice signal (case b), use painDescription to capture the collaboration
challenge the practice is addressing, put the practitioner's statement in evidence, and use
whyItMatters / underlyingIssue to explain the approach and what it reveals about collaboration needs.

CRITICAL RULES:
- Only extract a signal if the snippet identifies a real, named person and a real, named company.
- Never infer a collaboration problem or practice merely because a company is "undergoing
  transformation", "scaling", "restructuring", or similar generic business language. You need actual
  evidence of a stated problem OR a concretely described practice/experiment.
- classify evidence as DIRECT (the person explicitly describes the problem) or INDIRECT (the
  statement strongly suggests it without stating it outright).
- Never fabricate a quote. If the snippet gives you the person's exact words, you may quote them
  verbatim and set isParaphrase=false. Otherwise, write a faithful paraphrase and set
  isParaphrase=true — do not present a paraphrase as a direct quote.
- If a snippet does not contain a clear, attributable signal, skip it. It is correct to return an
  empty array if nothing in the snippets qualifies.
- patternKey groups signals into an evolving pattern, so it must be a STABLE, REUSABLE theme-level
  kebab-case slug — not a one-off phrase unique to a single signal. Prefer keys that many future
  signals could also share (e.g. "cross-functional-silos", "leadership-alignment-gap",
  "ai-adoption-friction", "psychological-safety-gap", "applied-improv-training",
  "knowledge-hoarding", "hybrid-coordination-friction", "trust-erosion").
- If an EXISTING PATTERNS list is provided above, and a signal fits one of those themes, you MUST
  reuse that exact patternKey and patternLabel verbatim so the pattern accumulates. Only invent a new
  patternKey when the signal represents a genuinely distinct theme not covered by any existing key.
- Do NOT encode company names, person names, or one-off specifics into patternKey. Two signals about
  the same underlying theme at different companies must share the same patternKey.

Respond with ONLY a JSON array, no commentary, where each element matches:
{
  "personName": string, "role": string, "seniorityLevel": "C_LEVEL"|"VP"|"DIRECTOR"|"MANAGER"|"OTHER",
  "company": string, "industry": string|null, "country": string|null, "companySize": string|null,
  "painCategory": one of the categories listed above (SCREAMING_SNAKE_CASE),
  "patternKey": string, "patternLabel": string,
  "painDescription": string, "evidence": string, "isParaphrase": boolean,
  "evidenceType": "DIRECT"|"INDIRECT",
  "sourceUrl": string, "sourceName": string|null, "sourceDate": string|null (ISO date if known),
  "confidence01": number, "organizationalRelevance01": number, "commercialRelevance01": number,
  "whyItMatters": string, "underlyingIssue": string, "commercialRelevanceNote": string
}`;

export async function runPainResearcher(agentRunId: string): Promise<{
  savedCount: number;
  skippedDuplicates: number;
  warnings: string[];
}> {
  if (!hasSearch()) {
    throw new AgentDependencyError(
      "TAVILY_API_KEY is not configured. The Pain Researcher requires live web search and will not fabricate signals without it."
    );
  }

  const warnings: string[] = [];
  // Target ~10 signals per run: cast a wider net across pain categories and pull
  // more results per query so the extractor has enough qualifying material.
  const queries = pickQueries(10);
  const allResults: (SearchResult & { query: string })[] = [];

  for (const query of queries) {
    try {
      const results = await webSearch(query, { maxResults: 8 });
      results.forEach((r) => allResults.push({ ...r, query }));
    } catch (err) {
      warnings.push(`Search failed for "${query}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (allResults.length === 0) {
    throw new AgentDependencyError(
      `All web searches failed this run. No unsupported signals were generated. Details: ${warnings.join("; ") || "no results returned"}`
    );
  }

  const seen = new Set<string>();
  const deduped = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Show the model the pattern vocabulary that already exists so it REUSES a
  // matching key (which grows that pattern over time) instead of coining a fresh
  // slug for every signal — that is what makes patterns aggregate. It may still
  // create a new key for a genuinely novel theme, preserving diversity.
  const existingPatterns = await prisma.pattern.findMany({
    select: { key: true, label: true, painCategory: true, signalCount: true },
    orderBy: { signalCount: "desc" },
    take: 40,
  });
  const patternVocab =
    existingPatterns.length > 0
      ? `EXISTING PATTERNS (reuse the exact patternKey + patternLabel when a signal fits one of these; only coin a NEW kebab-case key for a genuinely distinct theme):\n${JSON.stringify(
          existingPatterns.map((p) => ({ patternKey: p.key, patternLabel: p.label, painCategory: p.painCategory })),
          null,
          2
        )}\n\n`
      : "";

  const batchPrompt = `${patternVocab}SEARCH RESULTS TO ANALYZE:\n${JSON.stringify(
    deduped.map((r) => ({ title: r.title, url: r.url, content: r.content.slice(0, 1500), publishedDate: r.publishedDate })),
    null,
    2
  )}\n\nExtract qualifying signals now. Aim to return up to 10 distinct, high-quality signals if the snippets support them — but never fabricate or pad: only include signals with a real named person and company, and return fewer (or an empty array) if the material does not qualify.`;

  const candidates: Candidate[] = [];
  try {
    const raw = await generateJSON<unknown[]>({ system: SYSTEM_PROMPT, prompt: batchPrompt, maxTokens: 8192 });
    const rawArray = Array.isArray(raw) ? raw : [];
    // Validate per-item so one malformed candidate (e.g. an invented category)
    // doesn't discard the whole batch. Coerce an unknown painCategory to OTHER.
    for (const item of rawArray) {
      const normalized = normalizeCandidate(item);
      const parsed = CandidateSchema.safeParse(normalized);
      if (parsed.success) {
        candidates.push(parsed.data);
      } else {
        warnings.push(`Skipped a malformed candidate: ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
      }
    }
    if (candidates.length === 0 && rawArray.length === 0 && warnings.length === 0) {
      warnings.push("No qualifying signals found in this run's search results.");
    }
  } catch (err) {
    throw new AgentDependencyError(
      `Extraction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let savedCount = 0;
  let skippedDuplicates = 0;

  for (const c of candidates) {
    const isDup = await isDuplicateSignal({
      sourceUrl: c.sourceUrl,
      personName: c.personName,
      company: c.company,
      painCategory: c.painCategory,
    });
    if (isDup) {
      skippedDuplicates++;
      continue;
    }

    const sourceDate = c.sourceDate ? safeDate(c.sourceDate) : null;

    const company = await prisma.company.upsert({
      where: { name: c.company },
      update: { industry: c.industry ?? undefined, country: c.country ?? undefined, size: c.companySize ?? undefined },
      create: { name: c.company, industry: c.industry, country: c.country, size: c.companySize },
    });

    const person = await prisma.person.upsert({
      where: { name_companyId: { name: c.personName, companyId: company.id } },
      update: { role: c.role },
      create: { name: c.personName, role: c.role, companyId: company.id },
    });

    const source = await prisma.source.upsert({
      where: { url: c.sourceUrl },
      update: {},
      create: {
        url: c.sourceUrl,
        title: c.sourceName ?? undefined,
        publisherName: c.sourceName ?? undefined,
        sourceType: inferSourceType(c.sourceUrl),
        publishedAt: sourceDate ?? undefined,
      },
    });

    const confidenceScore = evidenceScore(c.evidenceType, c.confidence01);
    const seniority = seniorityScoreFromLevel(c.seniorityLevel as SeniorityLevel);
    const orgRelevance = organizationalRelevanceScore(c.organizationalRelevance01);
    const recency = recencyScoreOf(sourceDate);
    const commercial = commercialRelevanceScore(c.commercialRelevance01);
    const overall = overallScore({
      confidenceScore,
      seniorityScore: seniority,
      organizationalRelevanceScore: orgRelevance,
      recencyScore: recency,
      commercialRelevanceScore: commercial,
    });

    await prisma.signal.create({
      data: {
        agentRunId,
        personId: person.id,
        companyId: company.id,
        sourceId: source.id,
        personName: c.personName,
        role: c.role,
        company_: c.company,
        industry: c.industry,
        country: c.country,
        companySize: c.companySize,
        painCategory: c.painCategory as PainCategory,
        patternKey: c.patternKey,
        patternLabel: c.patternLabel,
        painDescription: c.painDescription,
        evidence: c.evidence,
        evidenceType: c.evidenceType,
        isParaphrase: c.isParaphrase,
        sourceUrl: c.sourceUrl,
        sourceName: c.sourceName,
        sourceDate,
        confidenceScore,
        seniorityScore: seniority,
        organizationalRelevanceScore: orgRelevance,
        recencyScore: recency,
        commercialRelevanceScore: commercial,
        overallScore: overall,
        whyItMatters: c.whyItMatters,
        underlyingIssue: c.underlyingIssue,
        commercialRelevanceNote: c.commercialRelevanceNote,
      },
    });
    savedCount++;
  }

  await recomputePatterns();

  return { savedCount, skippedDuplicates, warnings };
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
