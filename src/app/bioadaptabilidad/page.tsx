import Link from "next/link";
import { getBioadaptabilityReading, pressureLabel, type LevelReading } from "@/lib/bioadaptability";
import { pct, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BioadaptabilidadPage() {
  const { levels, totalSignals, hasData } = await getBioadaptabilityReading();

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="border-b border-line pb-6">
        <p className="kicker">Lente</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Bioadaptabilidad</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Una relectura del radar bajo el marco de la adaptabilidad al cambio. Cada fricción de colaboración se
          interpreta como un punto de tensión adaptativa y se ubica en el nivel donde vive: el colaborador, el equipo o
          la organización. Es una interpretación derivada de las mismas señales, no una nueva medición.
        </p>
      </header>

      {!hasData ? (
        <p className="mt-8 text-sm text-muted">
          Aún no hay señales suficientes para leer la bioadaptabilidad — ejecuta el Pain Researcher para comenzar a
          construir el radar.
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {levels.map((level) => (
              <LevelCard key={level.level} level={level} />
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            La <span className="font-semibold text-ink">presión adaptativa</span> es un índice interpretativo (0–100)
            que combina la concentración de señales de cada nivel con su crecimiento reciente. Un valor alto indica
            dónde la capacidad de adaptarse al cambio está siendo más exigida — no una carencia medida directamente.
            Total de señales interpretadas: <span className="font-mono text-ink">{totalSignals}</span>.
          </p>
        </>
      )}
    </div>
  );
}

function LevelCard({ level }: { level: LevelReading }) {
  const top = level.patterns.slice(0, 5);
  return (
    <div className="panel flex flex-col p-6">
      <p className="kicker">{level.subtitle}</p>
      <h2 className="mt-1 font-serif text-xl font-semibold text-ink">{level.title}</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">{level.facet}</p>

      <p className="mt-3 text-sm leading-relaxed text-muted">{level.description}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="label">Presión adaptativa</span>
          <span className="font-mono text-sm text-ink">
            {level.pressureIndex} · {pressureLabel(level.pressureIndex)}
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line/40">
          <div className="h-full rounded-full bg-ink" style={{ width: `${level.pressureIndex}%` }} />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-line py-2">
          <dt className="label">Señales</dt>
          <dd className="mt-1 font-mono text-sm text-ink">{level.totalSignals}</dd>
        </div>
        <div className="rounded border border-line py-2">
          <dt className="label">Patrones</dt>
          <dd className="mt-1 font-mono text-sm text-ink">{level.patternCount}</dd>
        </div>
        <div className="rounded border border-line py-2">
          <dt className="label">Tendencia</dt>
          <dd className={`mt-1 font-mono text-sm ${level.growthRate >= 0 ? "text-signal-interesting" : "text-muted"}`}>
            {pct(level.growthRate)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex-1">
        <p className="label mb-2">Patrones que tensionan la adaptación</p>
        {top.length === 0 ? (
          <p className="text-sm text-muted">Sin patrones en este nivel todavía.</p>
        ) : (
          <ul className="space-y-1.5">
            {top.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/patterns/${p.key}`}
                  className="flex items-center justify-between gap-3 text-sm text-ink hover:opacity-70"
                >
                  <span className="truncate">{p.label}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{p.signalCount}</span>
                </Link>
                <p className="text-[11px] uppercase tracking-wide text-muted">{titleCase(p.painCategory)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
