import "server-only";
import { z } from "zod";
import { prisma } from "../prisma";
import { generateJSON } from "../ai";
import { webSearch } from "../search";
import { hasSearch } from "../env";
import { isDuplicateContentIdea } from "../dedupe";
import { AgentDependencyError } from "./errors";

const EvidenceItemSchema = z.object({
  text: z.string(),
  kind: z.enum(["FACT", "INTERPRETATION", "HYPOTHESIS"]),
  sourceUrl: z.string().optional(),
});

const ContentOutputSchema = z.object({
  mainIdea: z.string(),
  whyItMatters: z.string(),
  evidence: z.array(EvidenceItemSchema).min(1),
  businessImplication: z.string(),
  linkedinPost: z.string(),
  alternativeHooks: z.array(z.string()).min(3).max(3),
  sources: z.array(z.object({ title: z.string(), url: z.string(), publisher: z.string().optional() })),
  score: z.number().min(0).max(100),
});

export type ContentOutput = z.infer<typeof ContentOutputSchema>;

const SYSTEM_PROMPT = `You are the Content Agent for Inteligencia Natural, an intelligence radar on
human collaboration, collective intelligence, organizational culture, leadership and human-AI
collaboration.

Your job is to produce ONE exceptional, non-obvious insight per run. Optimize for insight over
volume. Never fabricate research, statistics, studies, or quotations. If you reference a named
study, dataset, or statistic, it MUST come from the "AVAILABLE RESEARCH SNIPPETS" provided to you,
and you must set kind="FACT" and include the matching sourceUrl. Anything you reason yourself
(a pattern you notice, a connection you draw, a prediction) must be marked "INTERPRETATION" (a
reasoned reading of available evidence) or "HYPOTHESIS" (a plausible but unverified idea) instead,
with no invented citation.

Style for the LinkedIn post: intelligent, provocative, human, concise, sophisticated, accessible,
conversational. No corporate clichés, no generic AI hype, no fake personal anecdotes, no clickbait.

Respond with ONLY a JSON object matching this shape, no commentary outside the JSON:
{
  "mainIdea": string,            // one non-obvious insight, one or two sentences
  "whyItMatters": string,        // short explanation, 2-4 sentences
  "evidence": [ { "text": string, "kind": "FACT"|"INTERPRETATION"|"HYPOTHESIS", "sourceUrl"?: string } ],
  "businessImplication": string, // why CEOs/CHROs/COOs/CIOs/team leaders should care
  "linkedinPost": string,        // polished, publishable post, plain text
  "alternativeHooks": [string, string, string],
  "sources": [ { "title": string, "url": string, "publisher"?: string } ], // only sources actually used above
  "score": number                // your own 0-100 estimate of this idea's insight quality
}`;

export async function runContentAgent(agentRunId: string): Promise<{ contentId: string; warnings: string[] }> {
  const warnings: string[] = [];

  const [recentPatterns, recentIdeas] = await Promise.all([
    prisma.pattern.findMany({ orderBy: { signalCount: "desc" }, take: 5 }),
    prisma.contentItem.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { mainIdea: true } }),
  ]);

  let researchSnippets: { title: string; url: string; content: string }[] = [];
  if (hasSearch()) {
    try {
      const seed = recentPatterns[0]?.label ?? "collective intelligence workplace research";
      const results = await webSearch(`recent research ${seed} organizational collaboration`, { maxResults: 5 });
      researchSnippets = results.map((r) => ({ title: r.title, url: r.url, content: r.content.slice(0, 800) }));
    } catch (err) {
      warnings.push(
        `Web research unavailable (${err instanceof Error ? err.message : String(err)}); relying on general knowledge only, with claims marked as INTERPRETATION/HYPOTHESIS rather than FACT.`
      );
    }
  } else {
    warnings.push("TAVILY_API_KEY not configured; no fresh research snippets fetched this run.");
  }

  const buildPrompt = (avoidIdeas: string[]) => `EMERGING SIGNALS FROM THE PAIN RESEARCHER (may be empty early on):
${JSON.stringify(recentPatterns.map((p) => ({ label: p.label, signalCount: p.signalCount, growthRate: p.growthRate, topIndustries: p.topIndustries, topRoles: p.topRoles })), null, 2)}

AVAILABLE RESEARCH SNIPPETS (only cite these as FACT; cite nothing else as FACT):
${researchSnippets.length ? JSON.stringify(researchSnippets, null, 2) : "(none available this run)"}

RECENT CONTENT IDEAS ALREADY PUBLISHED — DO NOT REPEAT THESE, FIND A GENUINELY DIFFERENT ANGLE:
${JSON.stringify([...recentIdeas.map((r) => r.mainIdea), ...avoidIdeas], null, 2)}

Write today's piece now.`;

  let parsed: ContentOutput | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const avoid = parsed ? [parsed.mainIdea] : [];
      const raw = await generateJSON<unknown>({
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(avoid),
        maxTokens: 3000,
      });
      const candidate = ContentOutputSchema.parse(raw);
      const isDup = await isDuplicateContentIdea(candidate.mainIdea);
      if (isDup && attempt === 0) {
        warnings.push("First draft was too similar to recent content; regenerated with a different angle.");
        continue;
      }
      parsed = candidate;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!parsed) {
    if (lastError instanceof AgentDependencyError) throw lastError;
    throw new AgentDependencyError(
      `Content Agent could not produce valid output: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  const created = await prisma.contentItem.create({
    data: {
      agentRunId,
      mainIdea: parsed.mainIdea,
      whyItMatters: parsed.whyItMatters,
      evidence: parsed.evidence,
      businessImplication: parsed.businessImplication,
      linkedinPost: parsed.linkedinPost,
      alternativeHooks: parsed.alternativeHooks,
      sources: parsed.sources,
      score: Math.round(parsed.score),
      relatedPatternIds: recentPatterns.map((p) => p.id),
    },
  });

  return { contentId: created.id, warnings };
}
