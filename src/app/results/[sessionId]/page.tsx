"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ScoreRing } from "@/components/ScoreRing";
import { DimensionBar } from "@/components/DimensionBar";

type ResultsData =
  | { belowThreshold: true; minResponses: number; currentResponses: number }
  | {
      belowThreshold: false;
      overall: number;
      responseCount: number;
      dimensions: { key: string; name: string; value: number }[];
      strengths: { key: string; name: string; value: number }[];
      opportunities: { key: string; name: string; value: number; recommendation: string }[];
      frictions: string[];
    };

export default function ResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/results/${params.sessionId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.sessionId]);

  if (loading) return <main className="flex min-h-screen items-center justify-center text-ink/50">Cargando…</main>;
  if (!data) return null;

  if (data.belowThreshold) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-ink">Todavía estamos recopilando datos</h1>
        <p className="mt-4 text-ink/60">
          Para proteger el anonimato, necesitamos al menos {data.minResponses} respuestas completas antes de
          mostrar resultados agregados. Llevas {data.currentResponses}.
        </p>
        <Link href="/dashboard" className="btn-secondary mt-8">
          Volver al dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo">Resultados</p>
      <h1 className="mt-2 font-serif text-3xl text-ink">Una fotografía de la colaboración en tu organización</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Basado en {data.responseCount} personas. Esto es percepción, no una verdad absoluta — úsalo como punto
        de partida para conversar.
      </p>

      <div className="card mt-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-center">
          <ScoreRing value={data.overall} />
          <p className="mt-3 text-sm text-ink/50">Collaboration Score</p>
        </div>
        <div className="flex-1 space-y-4">
          {data.dimensions.map((d) => (
            <DimensionBar key={d.key} name={d.name} value={d.value} />
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-serif text-xl text-ink">Fortalezas</h2>
          <ul className="mt-4 space-y-3">
            {data.strengths.map((s) => (
              <li key={s.key} className="flex items-center justify-between text-sm">
                <span className="text-ink/80">{s.name}</span>
                <span className="font-medium text-indigo">{Math.round(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-serif text-xl text-ink">Áreas de oportunidad</h2>
          <ul className="mt-4 space-y-4">
            {data.opportunities.map((o) => (
              <li key={o.key} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink/80">{o.name}</span>
                  <span className="font-medium text-coral">{Math.round(o.value)}</span>
                </div>
                <p className="mt-1 text-ink/50">{o.recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.frictions.length > 0 && (
        <div className="card mt-8">
          <h2 className="font-serif text-xl text-ink">Fricciones posibles</h2>
          <ul className="mt-4 space-y-2">
            {data.frictions.map((f, i) => (
              <li key={i} className="rounded-xl bg-coral-light px-4 py-3 text-sm text-ink/80">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/dashboard" className="btn-secondary mt-10 inline-flex">
        ← Volver al dashboard
      </Link>
    </main>
  );
}
