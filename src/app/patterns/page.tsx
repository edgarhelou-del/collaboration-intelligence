import Link from "next/link";
import { getPatterns } from "@/lib/data";
import { pct } from "@/lib/format";
import { painCategoryLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function PatternsPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = searchParams.sort === "growing" ? "growing" : "frequent";
  const patterns = await getPatterns(sort);

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">Radar</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Patrones Emergentes</h1>
      </header>

      <div className="mt-6 flex gap-2 text-xs">
        <Link href="/patterns?sort=frequent" className={`btn-secondary ${sort === "frequent" ? "border-ink" : ""}`}>
          Más Frecuentes
        </Link>
        <Link href="/patterns?sort=growing" className={`btn-secondary ${sort === "growing" ? "border-ink" : ""}`}>
          De Mayor Crecimiento
        </Link>
      </div>

      {patterns.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Aún no se detectan patrones — ejecuta el Investigador de Dolores para empezar a construir el radar.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {patterns.map((p) => (
            <div key={p.id} className="panel p-6">
              <p className="kicker">{painCategoryLabel(p.painCategory)}</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-ink">{p.label}</h2>
              <p className="mt-2 text-sm text-muted">
                {p.signalCount} señal{p.signalCount === 1 ? "" : "es"} ·{" "}
                <span className={p.growthRate >= 0 ? "text-signal-interesting" : "text-muted"}>
                  {pct(p.growthRate)} vs 30 días previos
                </span>
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="label mb-1">Más Afectadas</p>
                  {(p.topIndustries as { name: string }[]).slice(0, 3).map((i) => (
                    <p key={i.name} className="text-ink/80">
                      {i.name}
                    </p>
                  ))}
                  {(p.topIndustries as unknown[]).length === 0 && <p className="text-muted">—</p>}
                </div>
                <div>
                  <p className="label mb-1">Roles Comunes</p>
                  {(p.topRoles as { name: string }[]).slice(0, 3).map((r) => (
                    <p key={r.name} className="text-ink/80">
                      {r.name}
                    </p>
                  ))}
                  {(p.topRoles as unknown[]).length === 0 && <p className="text-muted">—</p>}
                </div>
              </div>

              <Link href={`/patterns/${p.key}`} className="btn-secondary mt-5 inline-flex">
                Ver Patrón
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
