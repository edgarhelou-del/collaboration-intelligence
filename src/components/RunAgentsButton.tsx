"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startAgentRun, pollAgentRuns, type RunTarget } from "@/app/actions";

const AGENT_LABEL: Record<string, string> = {
  CONTENT: "Content",
  PAIN_RESEARCH: "Pain Researcher",
  BIO_ADAPTABILITY: "Bioadaptability",
};

export default function RunAgentsButton({
  target = "all",
  label = "Run All Agents",
  className = "btn-primary",
}: {
  target?: RunTarget;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop polling if the component unmounts mid-run.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function start() {
    if (running) return;
    setMessage(null);
    setIsError(false);
    setRunning(true);
    try {
      const { baseline, agents } = await startAgentRun(target);
      setMessage("Running\u2026 this can take a couple of minutes. You can keep using the app.");

      // Poll for completion instead of holding a single long request open.
      const deadline = Date.now() + 6 * 60 * 1000;
      const poll = async () => {
        try {
          const { done, perAgent } = await pollAgentRuns(baseline, agents);
          if (done) {
            setIsError(perAgent.some((p) => p.status === "FAILED"));
            setMessage(
              perAgent
                .map(
                  (p) =>
                    `${AGENT_LABEL[p.agent] ?? p.agent}: ${p.summary ?? p.status}${
                      p.error ? ` \u2014 ${p.error}` : ""
                    }`
                )
                .join(" \u00b7 ")
            );
            setRunning(false);
            router.refresh();
            return;
          }
          if (Date.now() > deadline) {
            setRunning(false);
            setMessage("Still running in the background \u2014 check the History page shortly for results.");
            return;
          }
          timer.current = setTimeout(poll, 2500);
        } catch {
          // A transient poll error shouldn't abort the run — retry until the deadline.
          if (Date.now() > deadline) {
            setRunning(false);
            setIsError(true);
            setMessage("Lost contact while checking progress. Check the History page for results.");
            return;
          }
          timer.current = setTimeout(poll, 3000);
        }
      };
      timer.current = setTimeout(poll, 2000);
    } catch (err) {
      setRunning(false);
      setIsError(true);
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <button onClick={start} disabled={running} className={className}>
        {running ? "Running\u2026" : label}
      </button>
      {message && (
        <p className={`mt-2 max-w-md text-xs ${isError ? "text-accent" : "text-muted"}`}>{message}</p>
      )}
    </div>
  );
}
