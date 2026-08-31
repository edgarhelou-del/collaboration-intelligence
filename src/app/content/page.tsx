import Link from "next/link";
import { getContentById, getContentHistory, getLatestContent } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";
import RunAgentsButton from "@/components/RunAgentsButton";
import ContentActions from "@/components/ContentActions";
import StatusBadge from "@/components/StatusBadge";
import ScorePill from "@/components/ScorePill";

export const dynamic = "force-dynamic";

type Evidence = { text: string; kind: "FACT" | "INTERPRETATION" | "HYPOTHESIS"; sourceUrl?: string };
type SourceItem = { title: string; url: string; publisher?: string };

export default async function ContentPage({ searchParams }: { searchParams: { id?: string } }) {
  const [item, history] = await Promise.all([
    searchParams.id ? getContentById(searchParams.id) : getLatestContent(),
    getContentHistory(),
  ]);

  return (
    <div className="px-8 py-8 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="kicker">Content Agent</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Today&rsquo;s Content</h1>
        </div>
        <RunAgentsButton target="content" label="Run Content Agent" className="btn-secondary" />
      </header>

      {!item ? (
        <p className="mt-8 text-sm text-muted">No content generated yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
          <article>
            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />
              <ScorePill score={item.score} />
              <span className="text-xs text-muted">{formatDateTime(item.createdAt)}</span>
            </div>

            <Section title="Main Idea">
              <p className="font-serif text-2xl leading-snug text-ink">{item.mainIdea}</p>
            </Section>

            <Section title="Why It Matters">
              <p className="text-[15px] leading-relaxed text-ink/90">{item.whyItMatters}</p>
            </Section>

            <Section title="Evidence">
              <ul className="space-y-3">
                {(item.evidence as Evidence[]).map((e, i) => (
                  <li key={i} className="border-l-2 border-line pl-4">
                    <span className="mr-2 rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {e.kind}
                    </span>
                    <span className="text-sm text-ink/90">{e.text}</span>
                    {e.sourceUrl && (
                      <a href={e.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-accent underline">
                        source
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Business Implication">
              <p className="text-[15px] leading-relaxed text-ink/90">{item.businessImplication}</p>
            </Section>

            <Section title="Publishable Post">
              <div className="whitespace-pre-wrap rounded border border-line bg-panel p-5 text-sm leading-relaxed text-ink">
                {item.linkedinPost}
              </div>
            </Section>

            <Section title="Alternative Hooks">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink/90">
                {(item.alternativeHooks as string[]).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </Section>

            <Section title="Sources">
              {(item.sources as SourceItem[]).length === 0 ? (
                <p className="text-sm text-muted">No external sources cited for this piece.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {(item.sources as SourceItem[]).map((s, i) => (
                    <li key={i}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline">
                        {s.title}
                      </a>
                      {s.publisher && <span className="text-muted"> — {s.publisher}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="mt-8 border-t border-line pt-6">
              <ContentActions item={item} />
            </div>
          </article>

          <aside>
            <p className="label mb-3">History</p>
            <ul className="space-y-3">
              {history.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/content?id=${h.id}`}
                    className={`block rounded border p-3 text-sm transition hover:border-ink ${
                      h.id === item.id ? "border-ink" : "border-line"
                    }`}
                  >
                    <p className="line-clamp-2 text-ink">{h.mainIdea}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(h.createdAt)} · {h.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="label mb-2">{title}</p>
      {children}
    </div>
  );
}
