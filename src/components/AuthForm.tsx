"use client";

import { ReactNode, useState } from "react";

export function useFormSubmit(endpoint: string, onSuccess: (data: any) => void) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(payload: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error inesperado.");
        return;
      }
      onSuccess(data);
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return { submit, error, loading };
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-indigo">Nodo</p>
      <h1 className="font-serif text-3xl text-ink">{title}</h1>
      {subtitle && <p className="mt-2 text-ink/60">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mb-4 rounded-xl bg-coral-light px-4 py-3 text-sm text-coral">{error}</p>;
}
