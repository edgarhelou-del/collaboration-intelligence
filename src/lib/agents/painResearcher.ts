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

const QUERY_TOPICS: Record<PainCategory, string> = {
  COLLABORATION: "cross-team collaboration problems",
  SILOS: "organizational silos breaking down teams",
  COMMUNICATION: "communication breakdown between teams",
  TRUST: "lack of trust between teams leadership",
  ALIGNMENT: "teams not aligned on priorities",
  KNOWLEDGE_SHARING: "knowledge hoarding lack of knowledge sharing",
  CULTURE: "toxic culture employees disengaged",
  LEADERSHIP: "leadership challenges managing distributed teams",
  PSYCHOLOGICAL_SAFETY: "psychological safety employees afraid to speak up",
  COORDINATION: "coordination problems between departments",
  HUMAN_AI_COLLABORATION: "employees struggling to collaborate with AI tools",
  OTHER: "organizational collaboration problems",
};

function pickQueries(n: number): string[] {
  const shuffled = [...PAIN_CATEGORIES].sort(() => Math.random() - 0.5).slice(0, n);
  return shuffled.map((cat) => {
    const role = ROLE_TERMS[Math.floor(Math.random() * ROLE_TERMS.length)];
    return `${role} interview quote "${QUERY_TOPICS[cat]}"`;
  });
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

const SYSTEM_PROMPT = `You are the Organizational Pain Researcher for KOLAB. You are given
snippets of real, publicly available web content (search results). Your job is to extract SIGNALS:
real people, at real companies, publicly expressing a real professional problem related to human
collaboration (silos, communication, trust, alignment, knowledge sharing, culture, leadership,
psychological safety, coordination, or human-AI collaboration).

CRITICAL RULES:
- Only extract a signal if the snippet identifies a real, named person and a real, named company.
- Never infer a collaboration problem merely because a company is "undergoing transformation",
  "scaling", "restructuring", or similar generic business language. You need actual evidence of
  a stated problem.
- classify evidence as DIRECT (the person explicitly describes the problem) or INDIRECT (the
  statement strongly suggests it without stating it outright).
- Never fabricate a quote. If the snippet gives you the person's exact words, you may quote them
  verbatim and set isParaphrase=false. Otherwise, write a faithful paraphrase and set
  isParaphrase=true — do not present a paraphrase as a direct quote.
- If a snippet does not contain a clear, attributable signal, skip it. It is correct to return an
  empty array if nothing in the snippets qualifies.
- patternKey must be a short kebab-case slug capturing the specific pattern (e.g.
  "cross-functional-silos", "leadership-alignment-gap", "ai-adoption-friction"), not just the
  broad category.

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
  const queries = pickQueries(5);
  const allResults: (SearchResult & { query: string })[] = [];

  for (const query of queries) {
    try {
      const results = await webSearch(query, { maxResults: 6 });
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

  const batchPrompt = `SEARCH RESULTS TO ANALYZE:\n${JSON.stringify(
    deduped.map((r) => ({ title: r.title, url: r.url, content: r.content.slice(0, 1500), publishedDate: r.publishedDate })),
    null,
    2
  )}\n\nExtract qualifying signals now.`;

  let candidates: Candidate[] = [];
  try {
    const raw = await generateJSON<unknown[]>({ system: SYSTEM_PROMPT, prompt: batchPrompt, maxTokens: 4096 });
    candidates = z.array(CandidateSchema).parse(raw);
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
