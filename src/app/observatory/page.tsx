import { cookies } from "next/headers";
import { accessConfigured, COOKIE, validSession } from "@/lib/observatory/auth";
import { state } from "@/lib/observatory/store";
import { login, logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function ObservatoryPage(props: { searchParams: Promise<{ topic?: string; error?: string }> }) {
  const params = await props.searchParams;
  const authenticated = validSession((await cookies()).get(COOKIE)?.value);
  if (!authenticated) return (
    <div lang="es" className="mx-auto max-w-lg px-6 py-16">
      <p className="kicker">Kolab · Espacio privado</p>
      <h1 className="mt-3 font-serif text-3xl">Observatorio</h1>
      {accessConfigured() ? <form action={login} className="mt-8 space-y-4">
        <label className="block text-sm">Clave de acceso
          <input type="password" name="accessToken" required autoComplete="current-password" className="mt-2 block w-full rounded border border-line bg-panel p-3" />
        </label>
        {params.error && <p role="alert" className="text-sm">No se pudo validar el acceso.</p>}
        <button className="btn-primary">Entrar</button>
      </form> : <p className="mt-6 text-sm text-muted">El acceso privado está pendiente de configuración.</p>}
    </div>
  );
  const data = await state();
  const items = data.items.filter(i => !params.topic || i.topic === params.topic).sort((a, b) => b.score - a.score);
  return (
    <div lang="es" className="px-6 py-8 sm:px-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div><p className="kicker">Kolab · Espacio privado</p><h1 className="mt-2 font-serif text-3xl">Observatorio</h1>
          <p className="mt-3 text-sm text-muted">{data.items.length} referencias · {data.drafts.length} borradores · {data.reports.length} análisis</p>
        </div>
        <form action={logout}><button className="btn-secondary">Cerrar sesión</button></form>
      </header>
      <p className="mt-4 text-sm text-muted">{data.settings.monitor_enabled ? "Recepción habilitada" : "Recepción pausada"} · Última revisión: {data.settings.last_research ? new Date(data.settings.last_research).toLocaleString("es-CO", { timeZone: "America/Bogota" }) : "Sin revisiones"}</p>
      <form className="my-6 flex flex-wrap gap-3"><label className="text-sm">Tema <select name="topic" defaultValue={params.topic ?? ""} className="ml-2 rounded border border-line bg-panel p-2"><option value="">Todos</option>{data.agents.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}</select></label><button className="btn-secondary">Filtrar</button></form>
      <h2 className="font-serif text-2xl">Biblioteca</h2>
      <p className="mt-2 text-xs text-muted">La puntuación expresa prioridad editorial, no certeza de la evidencia.</p>
      <div className="mt-5 space-y-5">{items.map(item => <article key={item.url} className="rounded border border-line bg-panel p-5">
        <p className="text-xs text-muted">{item.topic} · {item.evidence} · Prioridad {item.score}</p>
        <h3 className="mt-2 font-serif text-xl"><a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">{item.title}</a></h3>
        <p className="mt-2 text-xs text-muted">{item.source} · {item.published?.slice(0, 10) ?? "Sin fecha verificable"}</p>
        <p className="mt-4 text-sm leading-relaxed">{item.summary}</p>
        <p className="mt-3 text-sm leading-relaxed"><strong>Aplicación a Kolab:</strong> {item.insight}</p>
        <p className="mt-3 text-sm leading-relaxed"><strong>Límite de evidencia:</strong> {item.caveat}</p>
      </article>)}</div>
      {!items.length && <p className="mt-4 text-sm text-muted">Aún no hay referencias para esta selección.</p>}
      <h2 className="mt-12 font-serif text-2xl">Borradores de LinkedIn</h2>
      <p className="mt-2 text-sm text-muted">Contenido para revisión. No se publica automáticamente.</p>
      {data.drafts.map((draft, index) => <article key={index} className="mt-5 rounded border border-line bg-panel p-5"><h3 className="font-serif text-xl">{draft.title}</h3><p className="mt-2 text-sm text-muted">{draft.angle}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{draft.body}</p><a href={draft.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm underline">Fuente</a></article>)}
      <h2 className="mt-12 font-serif text-2xl">Conexiones y análisis</h2>
      {data.reports.map((report, index) => <article key={index} className="mt-5 rounded border border-line p-5"><h3 className="font-serif text-xl">{report.title}</h3><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{report.body}</p><ul className="mt-4 space-y-2">{report.references.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="break-all text-xs underline">{url}</a></li>)}</ul></article>)}
      <details className="mt-12 border-t border-line pt-6"><summary className="cursor-pointer text-sm">Revisiones y fuentes examinadas ({data.runs.length})</summary>{data.runs.slice(0, 50).map(run => <div key={run.runId} className="mt-4 text-xs"><p>{run.created} · {run.added} incorporaciones</p><ul className="mt-2">{run.details.map((d, i) => <li key={i}>{d.topic} · {d.source} · {d.status} · {d.found}{d.error ? ` · ${d.error}` : ""}</li>)}</ul></div>)}</details>
    </div>
  );
}
