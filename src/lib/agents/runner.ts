import "server-only";
import { prisma } from "../prisma";
import { runContentAgent } from "./contentAgent";
import { runPainResearcher } from "./painResearcher";
import { runBioAdaptability } from "./bioAdaptability";
import { AgentDependencyError } from "./errors";

export type AgentRunOutcome = {
  runId: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  summary: string;
  error?: string;
};

export async function runContent(): Promise<AgentRunOutcome> {
  const run = await prisma.agentRun.create({ data: { agent: "CONTENT" } });
  try {
    const { contentId, warnings } = await runContentAgent(run.id);
    const status = warnings.length ? "PARTIAL" : "SUCCESS";
    const summary = `Generated 1 content item${warnings.length ? ` (${warnings.length} note${warnings.length > 1 ? "s" : ""})` : ""}.`;
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        summary,
        resultCount: 1,
        metadata: { contentId, warnings },
      },
    });
    return { runId: run.id, status, summary };
  } catch (err) {
    return await fail(run.id, err);
  }
}

export async function runPainResearch(): Promise<AgentRunOutcome> {
  const run = await prisma.agentRun.create({ data: { agent: "PAIN_RESEARCH" } });
  try {
    const { savedCount, skippedDuplicates, warnings } = await runPainResearcher(run.id);
    const status = warnings.length ? "PARTIAL" : "SUCCESS";
    const summary = `Found ${savedCount} new signal${savedCount === 1 ? "" : "s"}${
      skippedDuplicates ? ` (${skippedDuplicates} duplicate${skippedDuplicates === 1 ? "" : "s"} skipped)` : ""
    }.`;
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        summary,
        resultCount: savedCount,
        metadata: { skippedDuplicates, warnings },
      },
    });
    return { runId: run.id, status, summary };
  } catch (err) {
    return await fail(run.id, err);
  }
}

export async function runBioAdaptabilityAgent(): Promise<AgentRunOutcome> {
  const run = await prisma.agentRun.create({ data: { agent: "BIO_ADAPTABILITY" } });
  try {
    const { savedCount, skippedDuplicates, warnings } = await runBioAdaptability(run.id);
    const status = warnings.length ? "PARTIAL" : "SUCCESS";
    const summary = `Found ${savedCount} new finding${savedCount === 1 ? "" : "s"}${
      skippedDuplicates ? ` (${skippedDuplicates} duplicate${skippedDuplicates === 1 ? "" : "s"} skipped)` : ""
    }.`;
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        summary,
        resultCount: savedCount,
        metadata: { skippedDuplicates, warnings },
      },
    });
    return { runId: run.id, status, summary };
  } catch (err) {
    return await fail(run.id, err);
  }
}

export async function runBoth(): Promise<{
  content: AgentRunOutcome;
  painResearch: AgentRunOutcome;
  bioAdaptability: AgentRunOutcome;
}> {
  // Run sequentially rather than in parallel: on the AI Gateway free tier,
  // firing every agent's model calls at once bursts past the per-minute rate
  // limit. Sequencing spreads the calls out so each can complete (and lets the
  // per-call backoff ride out the limit) instead of all failing together.
  const content = await runContent().catch((reason) => toFailedOutcome(reason));
  const painResearch = await runPainResearch().catch((reason) => toFailedOutcome(reason));
  const bioAdaptability = await runBioAdaptabilityAgent().catch((reason) => toFailedOutcome(reason));
  return { content, painResearch, bioAdaptability };
}

async function fail(runId: string, err: unknown): Promise<AgentRunOutcome> {
  const reason = err instanceof AgentDependencyError ? err.reason : err instanceof Error ? err.message : String(err);
  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "FAILED", finishedAt: new Date(), error: reason, summary: "Run failed." },
  });
  return { runId, status: "FAILED", summary: "Run failed.", error: reason };
}

function toFailedOutcome(reason: unknown): AgentRunOutcome {
  return { runId: "", status: "FAILED", summary: "Run failed to start.", error: String(reason) };
}
