"use client";

import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { LikertScale } from "@/components/LikertScale";

type Question = { id: string; code: string; text: string; dimensionName: string };
type CurrentData = {
  session: { id: string } | null;
  questions: Question[];
  responses: Record<string, number>;
};

export default function AssessmentPage() {
  const [data, setData] = useState<CurrentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/assessment/current")
      .then((r) => r.json())
      .then((d: CurrentData) => {
        setData(d);
        if (d.questions?.length) {
          const firstUnanswered = d.questions.findIndex((q) => d.responses[q.id] === undefined);
          const startIndex = firstUnanswered === -1 ? d.questions.length - 1 : firstUnanswered;
          setIndex(startIndex);
          setSelected(d.responses[d.questions[startIndex]?.id] ?? null);
          if (firstUnanswered === -1) setDone(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const currentQuestion = data?.questions[index];
  const answeredCount = useMemo(() => (data ? Object.keys(data.responses).length : 0), [data]);

  useEffect(() => {
    if (currentQuestion && data) {
      setSelected(data.responses[currentQuestion.id] ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  async function handleContinue() {
    if (!data?.session || !currentQuestion || selected === null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/assessment/${data.session.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: currentQuestion.id, value: selected }),
      });
      const result = await res.json();
      setData((d) => (d ? { ...d, responses: { ...d.responses, [currentQuestion.id]: selected } } : d));

      if (result.justCompleted || index === data.questions.length - 1) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (index > 0) setIndex((i) => i - 1);
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-ink/50">Cargando…</main>;
  }

  if (!data?.session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-ink">Aún no hay un diagnóstico activo</h1>
        <p className="mt-4 text-ink/60">
          Cuando el administrador de tu organización lance el diagnóstico, aparecerá aquí.
        </p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-indigo">Listo</p>
        <h1 className="font-serif text-3xl text-ink">Gracias por tu honestidad.</h1>
        <p className="mt-4 text-ink/60">
          Esto es una fotografía de la percepción de colaboración de tu organización, no un veredicto.
          Tus respuestas se combinan con las de tus compañeros para proteger tu anonimato.
        </p>
      </main>
    );
  }

  if (!currentQuestion) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <ProgressBar current={index} total={data.questions.length} />
      <p className="mt-10 text-xs font-medium uppercase tracking-widest text-indigo">
        {currentQuestion.dimensionName}
      </p>
      <h1 className="mt-3 font-serif text-2xl leading-snug text-ink sm:text-3xl">{currentQuestion.text}</h1>

      <div className="mt-8">
        <LikertScale value={selected} onChange={setSelected} />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={index === 0}
          className="text-sm text-ink/50 hover:text-ink disabled:opacity-0"
        >
          ← Atrás
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={selected === null || saving}
          onClick={handleContinue}
        >
          {saving ? "Guardando…" : "Continuar"}
        </button>
      </div>
      <p className="mt-6 text-center text-xs text-ink/30">
        {answeredCount} de {data.questions.length} respondidas · puedes continuar más tarde
      </p>
    </main>
  );
}
