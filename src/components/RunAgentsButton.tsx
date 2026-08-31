"use client";

import { useState, useTransition } from "react";
import { triggerContentAgent, triggerPainResearch, triggerRunAll } from "@/app/actions";

type Target = "all" | "content" | "pain-research";

export default function RunAgentsButton({
  target = "all",
  label = "Ejecutar Ambos Agentes",
  className = "btn-primary",
}: {
  target?: Target;
  label?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function run() {
    setMessage(null);
    startTransition(async () => {
      try {
        if (target === "content") {
          const res = await triggerContentAgent();
          setIsError(res.status === "FAILED");
          setMessage(res.error ? `${res.summary} ${res.error}` : res.summary);
        } else if (target === "pain-research") {
          const res = await triggerPainResearch();
          setIsError(res.status === "FAILED");
          setMessage(res.error ? `${res.summary} ${res.error}` : res.summary);
        } else {
          const res = await triggerRunAll();
          const failed = res.content.status === "FAILED" || res.painResearch.status === "FAILED";
          setIsError(failed);
          setMessage(
            `Contenido: ${res.content.summary}${res.content.error ? ` — ${res.content.error}` : ""} · Investigador de Dolores: ${res.painResearch.summary}${res.painResearch.error ? ` — ${res.painResearch.error}` : ""}`
          );
        }
      } catch (err) {
        setIsError(true);
        setMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div>
      <button onClick={run} disabled={isPending} className={className}>
        {isPending ? "Ejecutando…" : label}
      </button>
      {message && (
        <p className={`mt-2 max-w-md text-xs ${isError ? "text-accent" : "text-muted"}`}>{message}</p>
      )}
    </div>
  );
}
