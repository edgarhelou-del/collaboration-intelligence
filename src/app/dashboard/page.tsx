"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DashboardData = {
  organization: { name: string; domain: string };
  totalUsers: number;
  sessions: {
    id: string;
    status: string;
    launchedAt: string;
    overallScore: number | null;
    responseCount: number;
    participationPct: number;
  }[];
  activeSession: DashboardData["sessions"][number] | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dashboard");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLaunch() {
    setLaunching(true);
    try {
      await fetch("/api/assessment/launch", { method: "POST" });
      await load();
    } finally {
      setLaunching(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus(null);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const body = await res.json();
    if (!res.ok) {
      setInviteStatus(body.error ?? "No pudimos enviar la invitación.");
      return;
    }
    setInviteStatus(`Invitación creada para ${inviteEmail}. Compárteles el enlace de acceso: /join`);
    setInviteEmail("");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center text-paper/50">Cargando…</main>;
  if (!data) return null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-gold">{data.organization.name}</p>
          <h1 className="mt-1 font-serif text-3xl text-paper">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-paper/50 hover:text-paper">
            Configuración
          </Link>
          <button onClick={handleLogout} className="text-sm text-paper/50 hover:text-paper">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-paper/50">Participantes</p>
          <p className="mt-2 font-serif text-3xl text-paper">{data.totalUsers}</p>
        </div>
        <div className="card">
          <p className="text-sm text-paper/50">Sesión activa</p>
          <p className="mt-2 font-serif text-3xl text-paper">
            {data.activeSession ? `${data.activeSession.participationPct}%` : "—"}
          </p>
          {data.activeSession && <p className="mt-1 text-xs text-paper/40">{data.activeSession.responseCount} respuestas</p>}
        </div>
        <div className="card flex flex-col justify-between">
          <p className="text-sm text-paper/50">Diagnóstico</p>
          {data.activeSession ? (
            <Link href={`/results/${data.activeSession.id}`} className="mt-2 text-sm font-medium text-gold">
              Ver resultados →
            </Link>
          ) : (
            <button onClick={handleLaunch} disabled={launching} className="btn-primary mt-2 w-full">
              {launching ? "Lanzando…" : "Lanzar diagnóstico"}
            </button>
          )}
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="font-serif text-xl text-paper">Invitar participantes</h2>
        <p className="mt-1 text-sm text-paper/50">
          Solo se aceptan emails del dominio <span className="font-medium">{data.organization.domain}</span>.
        </p>
        <form onSubmit={handleInvite} className="mt-4 flex gap-3">
          <input
            className="input"
            type="email"
            required
            placeholder={`nombre@${data.organization.domain}`}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button type="submit" className="btn-secondary shrink-0">
            Invitar
          </button>
        </form>
        {inviteStatus && <p className="mt-3 text-sm text-paper/60">{inviteStatus}</p>}
      </div>

      <div className="card mt-8">
        <h2 className="font-serif text-xl text-paper">Historial de diagnósticos</h2>
        {data.sessions.length === 0 ? (
          <p className="mt-3 text-sm text-paper/50">Todavía no se ha lanzado ningún diagnóstico.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-paper">{new Date(s.launchedAt).toLocaleDateString()}</p>
                  <p className="text-paper/40">
                    {s.status === "ACTIVE" ? "Activo" : "Cerrado"} · {s.responseCount} respuestas
                  </p>
                </div>
                <Link href={`/results/${s.id}`} className="text-gold">
                  Ver resultados →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
