# KOLAB — Collaboration Intelligence Radar

Externally curated findings, drafts and reports can be received by authenticated
`/radar/api/observatory/*` endpoints and reviewed privately at `/radar/observatory`.
See [integration and deployment gates](docs/observatory-integration.md). This does
not enable or migrate the previous ChatGPT Sites automation by itself.

Default deployment: **Groq Free only**, using `groq/compound-mini` for live web
search and `openai/gpt-oss-20b` for extraction. Set `GROQ_API_KEY` from an account
that remains on the **Free** plan. `FREE_ONLY=true` is the default: existing
Tavily and AI Gateway credentials are ignored, including when Groq is unavailable.
There is no automatic upgrade, credit purchase or paid-provider fallback.

The shared UTC-day meter admits **at most 100 article excerpts** for analysis,
not 100 generated posts or guaranteed new findings. It counts excerpts delivered
to agents (including repeated URLs across runs), reserves slots atomically, and
keeps failed downstream reservations charged to the cap. Each search supplies up
to four raw source excerpts of 800 characters; each researcher uses at most two
queries per pass in free mode. Full article bodies are not retrieved. Run more
small passes when needed; the existing daily cron does not promise to fill 100 slots.

Groq currently documents 250 requests/day for Compound Mini and 1,000 requests/day,
8,000 tokens/minute and 200,000 tokens/day for GPT-OSS 20B. The application pauses
between generation calls and stops on a provider rejection; account token limits
can pause work before 100 excerpts. Verify the account-specific limits at activation.
Sources: [Groq rate limits](https://console.groq.com/docs/rate-limits),
[raw web search results](https://console.groq.com/docs/tool-use/built-in-tools/web-search).

Legacy providers require the explicit setting `FREE_ONLY=false` and are not part
of this free deployment profile.

An intelligence engine, not a content generator. Three agents scan how human
collaboration and bioadaptability are evolving inside real organizations, and
the system accumulates that into a radar: recurring patterns, their growth,
who is affected, and what it means.

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
- **Bioadaptability Researcher** finds attributed practitioner insights and
  research about adaptation at individual, team and organizational levels,
  scores them, and groups them into emerging patterns.
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

Deliberately Vercel-friendly: no containers or separate worker service for the
MVP. Long Server Actions use Next.js `after()` so the response can return while
Vercel keeps the scheduled work alive within the configured function duration.

- **Next.js 16 (App Router) + TypeScript + React 19 + Tailwind** — one
  deployable app, server components for all data-heavy pages, Server
  Actions for in-app mutations (approve content, change a signal's
  status, trigger an agent run from the dashboard).
- **PostgreSQL + Prisma** as the data-access layer. Domain reads are centralized
  in `src/lib/data.ts`; operational code also uses Prisma for run state, health
  checks and provider usage metering.
- **Three independent agent modules** under `src/lib/agents/`, orchestrated by
  `src/lib/agents/runner.ts`, which
  logs every run to the `AgentRun` table (status, summary, errors) so a
  failure is visible, not silent. `runBoth()` executes them sequentially to
  avoid bursting provider rate limits, and one failure does not block the next.
- **`src/lib/ai.ts`** wraps Groq through the Vercel AI SDK (server-only, key never sent
  to the browser). **`src/lib/search.ts`** wraps a web search provider
  (Groq Compound in free mode). Both throw a typed `AgentDependencyError` on failure, which
  the runner turns into a stored, user-visible error instead of a
  fabricated result.
- **Public API routes** (`/api/agents/content`, `/api/agents/pain-research`,
  `/api/agents/bio-adaptability`, `/api/agents/run-all`) exist for external/cron
  triggering. Deployed builds disable them unless `CRON_SECRET` is configured.
  The dashboard's own "Run" buttons
  don't call these — they use Server Actions (`src/app/actions.ts`) that
  invoke the same agent code in-process, so the UI never needs the
  secret.

```
src/app/            routes: / (dashboard), /content, /signals, /signals/[id],
                     /patterns, /patterns/[key], /history, /settings
src/app/api/agents/  POST endpoints for external/cron triggering
src/app/actions.ts   Server Actions used by the UI (run agents, approve
                     content, change signal status)
src/lib/agents/      the three researchers, runner.ts and typed errors
src/lib/ai.ts        Groq wrapper through the Vercel AI SDK
src/lib/search.ts    web search wrapper (Groq Compound)
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
2. When Groq is configured, runs one live web search
   for recent research related to the top pattern; those snippets are the *only* things it
   is allowed to cite as FACT (with a source URL). Anything else is
   labeled INTERPRETATION or HYPOTHESIS — never presented as a verified
   citation.
3. Calls the configured Groq model for structured JSON output, validated with `zod`.
4. Checks the idea against recent ideas (Jaccard similarity on title
   tokens); regenerates once if it's a near-duplicate.
5. Stores the result as a `ContentItem` (status `DRAFT`).

### Organizational Pain Researcher (`src/lib/agents/painResearcher.ts`)

1. Picks a rotating set of search queries across pain categories
   (silos, trust, communication, psychological safety, human-AI
   collaboration, …) and leadership roles (CEO, CHRO, COO, CIO, …).
2. Searches the live web via Groq Compound. If search isn't configured or every
   query fails, the run fails loudly — it does not invent signals.
3. Sends the search snippets to Groq with strict extraction rules: a
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

### Bioadaptability Researcher (`src/lib/agents/bioAdaptability.ts`)

1. Rotates queries across the individual, team and organization levels.
2. Uses Groq Compound for traceable, live sources and Groq for structured extraction.
3. Deduplicates and scores findings, then aggregates them into bioadaptability patterns.

### Adding another agent

1. Add an `AgentType` enum value in `prisma/schema.prisma` and run
   `npm run db:push`.
2. Create `src/lib/agents/yourAgent.ts` exporting a `runYourAgent(agentRunId)`
   function that writes its own rows and throws `AgentDependencyError` on
   any hard failure.
3. Add a `runYourAgent()` wrapper in `src/lib/agents/runner.ts` that
   creates the `AgentRun`, calls it, and records the outcome — copy the
   pattern from `runContent()` / `runPainResearch()`.
4. Wire it into `runBoth()` if it should run alongside the others, and
   add a route under `src/app/api/agents/` if it needs external
   triggering.

## 4. Local development

```bash
cp .env.example .env         # fill in DATABASE_URL at minimum
npm ci
npm run db:push              # creates tables from prisma/schema.prisma
npm run dev
```

Open http://localhost:3000/radar. Without a Groq key configured, the
dashboard still works — clicking "Run All Agents" will honestly report
that research/generation is unavailable rather than fabricating data
(see `src/lib/agents/errors.ts`).

## 5. Environment variables

See `.env.example`. Required for full functionality:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `APP_DATABASE_URL` | No | Full override for the application database connection |
| `APP_DB_NAME` | No | Isolated database name derived from `DATABASE_URL`; defaults to `collab_intel` |
| `GROQ_API_KEY` | Yes | Key from a Groq Free account, used for generation and web search |
| `FREE_ONLY` | No | Defaults to `true`; blocks paid-provider fallbacks |
| `ARTICLES_DAILY_LIMIT` | No | Up to 100 article excerpts per UTC day; defaults to 100 |
| `GROQ_MODEL` | No | Groq production model; defaults to `openai/gpt-oss-20b` |
| `TAVILY_API_KEY` | No | Legacy provider; ignored in free mode |
| `RESEARCH_MAX_QUERIES` | No | Max web searches per researcher pass. Free mode clamps this to at most `2` queries per pass |
| `CRON_SECRET` | Yes in production | Locks `/api/agents/*` to requests carrying this bearer token |

Timeouts, throttle intervals and provider usage guardrails are documented in
`.env.example`. The app-side counters are operational guardrails; provider-side
billing and spend controls remain authoritative.

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

- **Manually, from the UI**: the dashboard's "Run All Agents" button,
  or the equivalent buttons on `/content`, `/signals` and `/adaptability`.
- **Manually, via HTTP** (useful for cron/curl):
  ```bash
  curl -X POST http://localhost:3000/radar/api/agents/content
  curl -X POST http://localhost:3000/radar/api/agents/pain-research
  curl -X POST http://localhost:3000/radar/api/agents/bio-adaptability
  curl -X POST http://localhost:3000/radar/api/agents/run-all
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
   Development, Preview and Production settings. `DATABASE_URL`,
   `GROQ_API_KEY` and `CRON_SECRET` are the operational minimum on Vercel.
   Keep the Groq account on Free and use `FREE_ONLY=true`.
3. Deploy. `postinstall` runs `prisma generate` automatically.
4. Run `npx prisma db push` once (locally, pointed at the production
   `DATABASE_URL`, or via a one-off Vercel deploy hook) to create the
   tables in a new production database. Existing installations do not need a
   migration for the provider usage meter.
5. Verify `GET /radar/api/health`: HTTP 200 confirms database connectivity and the presence of required provider configuration.
   HTTP 503 reports missing configuration. Both responses report provider configuration as booleans without exposing secret values.

Every push and pull request also runs `.github/workflows/ci.yml` (locked install,
Prisma validation, source-evidence tests, a concurrent 100-excerpt cap test against
PostgreSQL, lint, type-check and production build) before merge.

## 10. Future scheduling

`vercel.json` defines a daily cron hitting `/radar/api/agents/run-all`:

```json
{ "crons": [{ "path": "/radar/api/agents/run-all", "schedule": "0 8 * * *" }] }
```

Set `CRON_SECRET` in the Vercel project before relying on this, so that
endpoint only accepts Vercel Cron's own request (and your own curl
tests) rather than being open to the public internet. Nothing else needs
to change — the same `runBoth()` function backs the manual button, the
API route, and the cron job. If agent execution later needs to move to a
dedicated worker (long-running scrapes, heavier extraction), the agents
are already isolated in `src/lib/agents/` with no dependency on the
Next.js request/response cycle, so they can be lifted into a standalone
process without rewriting them.

## 11. How to add another agent

See "Adding another agent" under section 3 above.

AI Gateway requests share a 20-second pause after each request (`AI_MIN_SPACING_MS`). Gateway retries are disabled to avoid retry bursts on free-tier rate limits; smaller extraction batches fit serverless execution windows. Provider limits still apply.
