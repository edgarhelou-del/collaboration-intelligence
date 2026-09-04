> **Nota:** este repositorio también contiene, en [`/keynote`](./keynote),
> un producto independiente sin relación con la app de abajo: una
> presentación web navegable en pantalla completa ("Bioadaptabilidad en el
> mundo corporativo", para CENIT). Ver [`keynote/README.md`](./keynote/README.md).

# Inteligencia Natural — Collaboration Intelligence Radar

An intelligence engine, not a content generator. Two agents continuously
scan for how human collaboration is actually breaking down inside real
organizations, and the system accumulates that into a radar: recurring
patterns, their growth, who is affected, and what it means.

The accumulated intelligence — signals and patterns over time — is the
product. Daily content is a byproduct of it, not the goal.

## 1. What the project does

- **Content Agent** produces one high-insight piece per run about
  collective intelligence / human collaboration: a main idea, why it
  matters, evidence (explicitly labeled FACT / INTERPRETATION /
  HYPOTHESIS — it never fabricates a citation), a business implication,
  a publishable post, three alternative hooks, and sources.
- **Organizational Pain Researcher** searches the live web for real
  people at real companies publicly describing a real collaboration
  problem (silos, trust, communication breakdown, psychological safety,
  human-AI collaboration, etc.), scores each one 0–100, and stores it as
  a **signal**.
- Signals are grouped into **emerging patterns** (e.g. "cross-functional
  silos") and re-aggregated on every Pain Researcher run: signal count,
  growth vs. the previous 30 days, most affected industries/countries/
  roles, and a short AI-generated synthesis — clearly labeled as such.
- Every dashboard shows **what was found → where it came from → what the
  AI interpreted**. Nothing is hidden behind the model; every claim
  traces to a source URL or is explicitly marked as reasoning, not fact.
- If research fails (no API key, a search error, an unparseable model
  response), the UI shows exactly that — it never fabricates a result to
  fill the gap.

## 2. Architecture

Deliberately Vercel-friendly: no queues, no containers, no separate
worker service for the MVP.

- **Next.js 14 (App Router) + TypeScript + React + Tailwind** — one
  deployable app, server components for all data-heavy pages, Server
  Actions for in-app mutations (approve content, change a signal's
  status, trigger an agent run from the dashboard).
- **PostgreSQL + Prisma** as the data-access layer. All reads go through
  `src/lib/data.ts`; nothing outside it calls Prisma directly, so the
  provider can be swapped later without touching pages.
- **Two independent agent modules** under `src/lib/agents/` (`contentAgent.ts`,
  `painResearcher.ts`), orchestrated by `src/lib/agents/runner.ts`, which
  logs every run to the `AgentRun` table (status, summary, errors) so a
  failure is visible, not silent. If one agent fails, the other still
  runs — see `runBoth()`, which uses `Promise.allSettled`.
- **`src/lib/ai.ts`** wraps the Anthropic API (server-only, key never sent
  to the browser). **`src/lib/search.ts`** wraps a web search provider
  (Tavily). Both throw a typed `AgentDependencyError` on failure, which
  the runner turns into a stored, user-visible error instead of a
  fabricated result.
- **Public API routes** (`/api/agents/content`, `/api/agents/pain-research`,
  `/api/agents/run-all`) exist for external/cron triggering and are
  gated by `CRON_SECRET` when set. The dashboard's own "Run" buttons
  don't call these — they use Server Actions (`src/app/actions.ts`) that
  invoke the same agent code in-process, so the UI never needs the
  secret.

```
src/app/            routes: / (dashboard), /content, /signals, /signals/[id],
                     /patterns, /patterns/[key], /history, /settings
src/app/api/agents/  POST endpoints for external/cron triggering
src/app/actions.ts   Server Actions used by the UI (run agents, approve
                     content, change signal status)
src/lib/agents/      contentAgent.ts, painResearcher.ts, runner.ts, errors.ts
src/lib/ai.ts        Anthropic wrapper
src/lib/search.ts    web search wrapper (Tavily)
src/lib/scoring.ts   deterministic 0–100 signal scoring
src/lib/patterns.ts  signal → pattern aggregation + AI synthesis
src/lib/dedupe.ts    duplicate-signal / duplicate-idea checks
src/lib/data.ts      the data-access layer — all page reads go through here
prisma/schema.prisma the full data model
```

## 3. Agents

### Content Agent (`src/lib/agents/contentAgent.ts`)

1. Reads the top emerging patterns and the last 10 published ideas
   (for deduplication).
2. If `TAVILY_API_KEY` is set, runs one web search for recent research
   related to the top pattern; those snippets are the *only* things it
   is allowed to cite as FACT (with a source URL). Anything else is
   labeled INTERPRETATION or HYPOTHESIS — never presented as a verified
   citation.
3. Calls Claude for structured JSON output, validated with `zod`.
4. Checks the idea against recent ideas (Jaccard similarity on title
   tokens); regenerates once if it's a near-duplicate.
5. Stores the result as a `ContentItem` (status `DRAFT`).

### Organizational Pain Researcher (`src/lib/agents/painResearcher.ts`)

1. Picks a rotating set of search queries across pain categories
   (silos, trust, communication, psychological safety, human-AI
   collaboration, …) and leadership roles (CEO, CHRO, COO, CIO, …).
2. Searches the live web via Tavily. If search isn't configured or every
   query fails, the run fails loudly — it does not invent signals.
3. Sends the search snippets to Claude with strict extraction rules: a
   real named person and real named company are required; a company
   "undergoing transformation" is never inferred to have a collaboration
   problem without actual evidence; quotes are only used verbatim when
   the snippet gives exact words, otherwise it's a labeled paraphrase.
4. Deduplicates against existing signals (same source URL, or same
   person + company + pain category).
5. Scores each signal deterministically (`src/lib/scoring.ts`): evidence
   strength (30 pts, DIRECT > INDIRECT, scaled by the model's stated
   confidence), seniority (20 pts, inferred from role), organizational
   relevance (20 pts), recency (15 pts, from the source's publish date),
   commercial potential (15 pts) → 0–100 total, classified Exceptional
   (90+) / Strong (75+) / Interesting (60+) / Archive (<60).
6. Recomputes every `Pattern` row (`src/lib/patterns.ts`), grouped by a
   fine-grained `patternKey` the model assigns (e.g.
   `cross-functional-silos`, not just the broad "Silos" category), and
   regenerates the pattern's AI synthesis when its signal count changed.

### Adding a third agent

1. Add an `AgentType` enum value in `prisma/schema.prisma` and run
   `npm run db:push`.
2. Create `src/lib/agents/yourAgent.ts` exporting a `runYourAgent(agentRunId)`
   function that writes its own rows and throws `AgentDependencyError` on
   any hard failure.
3. Add a `runYourAgent()` wrapper in `src/lib/agents/runner.ts` that
   creates the `AgentRun`, calls it, and records the outcome — copy the
   pattern from `runContent()` / `runPainResearch()`.
4. Wire it into `runBoth()` if it should run alongside the other two, and
   add a route under `src/app/api/agents/` if it needs external
   triggering.

## 4. Local development

```bash
cp .env.example .env         # fill in DATABASE_URL at minimum
npm install
npm run db:push              # creates tables from prisma/schema.prisma
npm run dev
```

Open http://localhost:3000. Without `ANTHROPIC_API_KEY` / `TAVILY_API_KEY`
set, the dashboard still works — clicking "Run Both Agents" will honestly
report that research/generation is unavailable rather than fabricating
data (see `src/lib/agents/errors.ts`).

## 5. Environment variables

See `.env.example`. Required for full functionality:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | For content/extraction | Server-side only, never sent to the browser |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-5` |
| `TAVILY_API_KEY` | For the Pain Researcher | Without it, that agent refuses to run rather than invent signals |
| `CRON_SECRET` | No | Locks `/api/agents/*` to requests carrying this bearer token (Vercel Cron sends it automatically) |

## 6. Database setup

Schema lives in `prisma/schema.prisma` (PostgreSQL). Any Postgres
provider works; for Vercel, the easiest paths are **Vercel Postgres** or
**Neon** (both give you a connection string you drop straight into
`DATABASE_URL`).

```bash
npm run db:push       # sync schema to the database
npm run db:generate   # regenerate the Prisma client after a schema change
```

There is no seed script — the tables start empty and fill up as the
agents run. All reads go through `src/lib/data.ts`, so switching
providers later never requires touching a page component.

## 7. Running the agents

- **Manually, from the UI**: the dashboard's "Run Both Agents" button,
  or the equivalent buttons on `/content` and `/signals`.
- **Manually, via HTTP** (useful for cron/curl):
  ```bash
  curl -X POST http://localhost:3000/api/agents/content
  curl -X POST http://localhost:3000/api/agents/pain-research
  curl -X POST http://localhost:3000/api/agents/run-all
  ```
  If `CRON_SECRET` is set, add `-H "Authorization: Bearer $CRON_SECRET"`.

## 8. Deployment to GitHub

```bash
git add -A
git commit -m "your message"
git push -u origin <branch-name>
```

## 9. Deployment to Vercel

1. Import the GitHub repository in Vercel.
2. Add the environment variables from `.env.example` in the project's
   Vercel settings (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`,
   optionally `ANTHROPIC_MODEL` and `CRON_SECRET`).
3. Deploy. `postinstall` runs `prisma generate` automatically.
4. Run `npx prisma db push` once (locally, pointed at the production
   `DATABASE_URL`, or via a one-off Vercel deploy hook) to create the
   tables in the production database.

## 10. Future scheduling

`vercel.json` already defines a daily cron hitting `/api/agents/run-all`:

```json
{ "crons": [{ "path": "/api/agents/run-all", "schedule": "0 8 * * *" }] }
```

Set `CRON_SECRET` in the Vercel project once you rely on this, so that
endpoint only accepts Vercel Cron's own request (and your own curl
tests) rather than being open to the public internet. Nothing else needs
to change — the same `runBoth()` function backs the manual button, the
API route, and the cron job. If agent execution later needs to move to a
dedicated worker (long-running scrapes, heavier extraction), the agents
are already isolated in `src/lib/agents/` with no dependency on the
Next.js request/response cycle, so they can be lifted into a standalone
process without rewriting them.

## 11. How to add another agent

See "Adding a third agent" under section 3 above.
