import "server-only";
import { prisma } from "../prisma";
import { runContentAgent } from "./contentAgent";
import { runPainResearcher } from "./painResearcher";
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
    const summary = `Se generó 1 pieza de contenido${warnings.length ? ` (${warnings.length} nota${warnings.length > 1 ? "s" : ""})` : ""}.`;
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
    const summary = `Se encontr${savedCount === 1 ? "ó" : "aron"} ${savedCount} señal${savedCount === 1 ? "" : "es"} nueva${savedCount === 1 ? "" : "s"}${
      skippedDuplicates ? ` (${skippedDuplicates} duplicada${skippedDuplicates === 1 ? "" : "s"} omitida${skippedDuplicates === 1 ? "" : "s"})` : ""
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

export async function runBoth(): Promise<{ content: AgentRunOutcome; painResearch: AgentRunOutcome }> {
  // Run sequentially rather than in parallel: on the AI Gateway free tier,
  // firing both agents' model calls at once bursts past the per-minute rate
  // limit. Sequencing spreads the calls out so each can complete (and lets the
  // per-call backoff ride out the limit) instead of both failing together.
  const content = await runContent().catch((reason) => toFailedOutcome(reason));
  const painResearch = await runPainResearch().catch((reason) => toFailedOutcome(reason));
  return { content, painResearch };
}

async function fail(runId: string, err: unknown): Promise<AgentRunOutcome> {
  const reason = err instanceof AgentDependencyError ? err.reason : err instanceof Error ? err.message : String(err);
  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "FAILED", finishedAt: new Date(), error: reason, summary: "La ejecución falló." },
  });
  return { runId, status: "FAILED", summary: "La ejecución falló.", error: reason };
}

function toFailedOutcome(reason: unknown): AgentRunOutcome {
  return { runId: "", status: "FAILED", summary: "La ejecución no pudo iniciarse.", error: String(reason) };
}
