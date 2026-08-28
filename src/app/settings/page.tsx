"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrgData = {
  organization: { name: string; domain: string; minResponsesForResults: number; showIndividualResults: boolean };
  users: { id: string; name: string; email: string; role: string; createdAt: string }[];
};

export default function SettingsPage() {
  const [data, setData] = useState<OrgData | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/organization")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateSetting(patch: Partial<OrgData["organization"]>) {
    setSaving(true);
    try {
      await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      load();
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <main className="flex min-h-screen items-center justify-center text-ink/50">Cargando…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/dashboard" className="text-sm text-ink/50 hover:text-ink">
        ← Dashboard
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-ink">Configuración de {data.organization.name}</h1>

      <div className="card mt-8">
        <h2 className="font-serif text-xl text-ink">Privacidad</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink">Mínimo de respuestas para mostrar resultados</p>
              <p className="text-ink/50">Protege el anonimato individual en los agregados de la organización.</p>
            </div>
            <input
              type="number"
              min={1}
              className="input w-20 text-center"
              defaultValue={data.organization.minResponsesForResults}
              onBlur={(e) => updateSetting({ minResponsesForResults: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink">Permitir que cada persona vea su propio resultado</p>
              <p className="text-ink/50">Nunca se muestran resultados individuales a los administradores.</p>
            </div>
            <input
              type="checkbox"
              checked={data.organization.showIndividualResults}
              disabled={saving}
              onChange={(e) => updateSetting({ showIndividualResults: e.target.checked })}
              className="h-5 w-5 rounded border-line"
            />
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="font-serif text-xl text-ink">Usuarios ({data.users.length})</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          {data.users.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-ink">{u.name}</p>
                <p className="text-ink/40">{u.email}</p>
              </div>
              <span className="rounded-full bg-indigo-light px-3 py-1 text-xs text-indigo">
                {u.role === "ORG_ADMIN" ? "Admin" : "Participante"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
