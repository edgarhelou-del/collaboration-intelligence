"use client";

import { ReactNode, useState } from "react";
import { Logo } from "@/components/Logo";
import { NetworkMotif } from "@/components/NetworkMotif";

export function useFormSubmit(endpoint: string, onSuccess: (data: any) => void) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(payload: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
      setLoading(false);
      return;
    }

    try {
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error inesperado.");
        return;
      }
      onSuccess(data);
    } catch {
      setError(
        res.ok
          ? "El servidor respondió con datos inesperados. Intenta de nuevo."
          : `El servidor devolvió un error (${res.status}). Revisa los logs del deploy en Vercel.`
      );
    } finally {
      setLoading(false);
    }
  }

  return { submit, error, loading };
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <NetworkMotif className="pointer-events-none absolute -right-40 -top-20 h-[90%] w-auto max-w-none opacity-50 sm:-right-24" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Logo className="mb-10" />
        <h1 className="font-serif text-3xl text-paper">{title}</h1>
        {subtitle && <p className="mt-2 text-paper/60">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

export function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mb-4 rounded-xl bg-rose-light px-4 py-3 text-sm text-rose">{error}</p>;
}
