"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  runBoth,
  runContent,
  runPainResearch,
  runBioAdaptabilityAgent,
  reconcileStaleRuns,
} from "@/lib/agents/runner";
import type { AgentType, BioStatus, ContentStatus, SignalStatus } from "@prisma/client";

export type RunTarget = "all" | "content" | "pain-research" | "bio-adaptability";

function launch(work: () => Promise<unknown>) {
  // `after` asks Next.js/Vercel to keep the function alive after the Server
  // Action response is sent. A module-level Promise set is not sufficient on
  // serverless runtimes because the instance may be frozen immediately.
  after(async () => {
    try {
      await work();
    } catch (err) {
      console.error("[kolab] background agent run failed:", err);
    }
  });
}

// Start an agent run WITHOUT awaiting it. Long agent runs (minutes of web
// search + extraction) used to be awaited inside the server action, holding the
// browser's fetch open until it timed out with "Failed to fetch". Instead we
// kick the work off in the background and return immediately; the client polls
// `pollAgentRuns` for progress. `baseline` lets polling ignore older runs.
export async function startAgentRun(
  target: RunTarget
): Promise<{ baseline: string; agents: AgentType[] }> {
  // Clear out any orphaned RUNNING runs from a prior restart so they don't
  // linger in history or interfere with fresh runs.
  await reconcileStaleRuns();
  const agents: AgentType[] =
    target === "content"
      ? ["CONTENT"]
      : target === "pain-research"
        ? ["PAIN_RESEARCH"]
        : target === "bio-adaptability"
          ? ["BIO_ADAPTABILITY"]
          : ["CONTENT", "PAIN_RESEARCH", "BIO_ADAPTABILITY"];

  const activeRun = await prisma.agentRun.findFirst({
    where: { agent: { in: agents }, status: "RUNNING" },
    select: { agent: true },
  });
  if (activeRun) {
    throw new Error(`${activeRun.agent.replaceAll("_", " ")} is already running. Check History for progress.`);
  }

  const baseline = new Date();

  if (target === "content") launch(runContent);
  else if (target === "pain-research") launch(runPainResearch);
  else if (target === "bio-adaptability") launch(runBioAdaptabilityAgent);
  else launch(runBoth);

  return { baseline: baseline.toISOString(), agents };
}

export type AgentRunProgress = {
  agent: AgentType;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  finished: boolean;
  summary: string | null;
  error: string | null;
};

export async function pollAgentRuns(
  baselineISO: string,
  agents: AgentType[]
): Promise<{ done: boolean; perAgent: AgentRunProgress[] }> {
  // If the current run itself hangs long enough, reconcile flips it to FAILED
  // so polling resolves instead of spinning until the client safety timeout.
  await reconcileStaleRuns();
  const since = new Date(baselineISO);
  const runs = await prisma.agentRun.findMany({
    where: { agent: { in: agents }, startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
  });

  // Keep only the most recent run per agent since the baseline.
  const latest = new Map<AgentType, (typeof runs)[number]>();
  for (const r of runs) if (!latest.has(r.agent)) latest.set(r.agent, r);

  const perAgent: AgentRunProgress[] = agents.map((agent) => {
    const r = latest.get(agent);
    return {
      agent,
      status: (r?.status ?? "RUNNING") as AgentRunProgress["status"],
      finished: Boolean(r?.finishedAt),
      summary: r?.summary ?? null,
      error: r?.error ?? null,
    };
  });

  // Done only when every targeted agent has a finished run since the baseline.
  const done = perAgent.every((p) => p.finished);
  if (done) {
    revalidatePath("/");
    revalidatePath("/content");
    revalidatePath("/signals");
    revalidatePath("/patterns");
    revalidatePath("/adaptability");
    revalidatePath("/adaptability/patterns");
    revalidatePath("/history");
  }
  return { done, perAgent };
}

export async function triggerRunAll() {
  const outcome = await runBoth();
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/signals");
  revalidatePath("/patterns");
  revalidatePath("/adaptability");
  revalidatePath("/adaptability/patterns");
  revalidatePath("/history");
  return outcome;
}

export async function triggerBioAdaptability() {
  const outcome = await runBioAdaptabilityAgent();
  revalidatePath("/");
  revalidatePath("/adaptability");
  revalidatePath("/adaptability/patterns");
  revalidatePath("/history");
  return outcome;
}

export async function triggerContentAgent() {
  const outcome = await runContent();
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/history");
  return outcome;
}

export async function triggerPainResearch() {
  const outcome = await runPainResearch();
  revalidatePath("/");
  revalidatePath("/signals");
  revalidatePath("/patterns");
  revalidatePath("/history");
  return outcome;
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  await prisma.contentItem.update({ where: { id }, data: { status } });
  revalidatePath("/content");
  revalidatePath("/");
}

export async function editContent(
  id: string,
  fields: Partial<{
    mainIdea: string;
    whyItMatters: string;
    businessImplication: string;
    linkedinPost: string;
  }>
) {
  await prisma.contentItem.update({ where: { id }, data: fields });
  revalidatePath("/content");
}

export async function updateSignalStatus(id: string, status: SignalStatus) {
  await prisma.signal.update({ where: { id }, data: { status } });
  revalidatePath("/signals");
  revalidatePath(`/signals/${id}`);
}

export async function updateBioFindingStatus(id: string, status: BioStatus) {
  await prisma.bioFinding.update({ where: { id }, data: { status } });
  revalidatePath("/adaptability");
  revalidatePath(`/adaptability/${id}`);
}
