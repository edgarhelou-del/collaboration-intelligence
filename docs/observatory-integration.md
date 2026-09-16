# Private Kolab observatory ingestion

This connects externally curated research to **this** application, not the
separate ChatGPT Site. It makes no model/provider calls and does not publish to
LinkedIn. The existing Groq Free policy is unchanged.

## Routes (include the existing `/radar` base path)

- Private UI: `/radar/observatory`
- GET `/radar/api/observatory/state`
- GET `/radar/api/observatory/ingest` (current contract)
- POST `/radar/api/observatory/ingest` (JSON)

All API operations require `Authorization: Bearer <RADAR_INGEST_TOKEN>`.
No credential, including the ChatGPT Sites token, should be put in URLs, logs,
repository files, automation prompt text, or chat responses. A Sites token is
not valid here. Missing configuration returns 503; invalid access returns 401.

Provision `RADAR_INGEST_TOKEN` with at least 32 random characters in the existing
Vercel project's encrypted environment and the authorized research runner's
secret store. Rotate it in both places together. The UI exchanges the key for
an eight-hour signed, HttpOnly, Secure-in-production, SameSite=Strict cookie.
API requests require the bearer even when a UI session exists. Rotation also
invalidates existing sessions. Do not remove deployment protection to connect.

## Storage and privacy

Reviews use the existing `agent_runs.metadata` JSON column with a versioned
`kolab-observatory-v1` discriminator and `observatory:` ID namespace. This is
an ingestion journal, not a generated-content agent run. No database schema
migration or replacement is required. Items, private drafts, reports and
source-check details commit together. They are excluded from the existing
public agent history/polling; they never become public ContentItem rows.

The existing ChatGPT Site's collection is not deleted or copied automatically.
Historical import needs a separate reviewed migration that preserves original
dates and does not treat old drafts as newly written daily content.

## Preferences

- `RADAR_MONITOR_ENABLED=false` pauses new ingestion (default true).
- `RADAR_DISABLED_TOPICS` is a comma-separated list of disabled IDs.
- `RADAR_QUERIES_JSON` optionally overrides each topic's current search query.

IDs: collaboration, collective, arts, improv, safety, ai, adaptability.
The GET state response is authoritative for enabled topics, queries, existing
URLs, last review and remaining editorial quotas. The UI pause indicator refers
to reception by the app, not the status of any external scheduler.

## Integrity and limits

- At most eight findings per review; request body at most 200,000 bytes.
- URL canonicalization removes fragments and common tracking parameters,
  preserves meaningful parameters, and deduplicates within/across reviews.
- Stable runId: identical retry returns the committed result; changed content
  with the same ID returns 409. It never replaces prior curation.
- A transaction-scoped PostgreSQL advisory lock serializes ingest decisions.
- Two new drafts and one report per Bogotá calendar day, enforced across
  concurrent requests. No override from a client-supplied flag is supported.
- New findings share the existing atomic article budget, at most 100/day UTC,
  with internal researchers. Duplicate/replayed findings consume no slots.
- Draft/report references must already be in the collection or in this batch.
- Disabled topics, future inspection/publication dates and unsafe links fail
  validation. These checks do not establish scientific validity: the curator
  still must open original sources and distinguish evidence from inference.
- Empty reviews are stored when details are supplied. Quota/auth/validation
  failures store nothing. Retry only a transient failure with the same payload.

## Deployment gate

This branch builds on PR #19 (`codex/recover-and-stabilize-deployment`). Do not
drop those runtime fixes by deploying the old default branch. Review and land
the dependency first, then this change, or deploy the tested combined commit.
Use the **existing** Vercel project `collaboration-intelligence` in
`edgarhelou-7535s-projects`; do not create another project.

Before resuming Radar Kolab:

1. Verify project access and the actual production alias in Vercel.
2. Deploy the tested commit and configure the dedicated token in both systems.
3. Confirm unauthenticated API requests return 401 and the UI exposes no data.
4. With authorized access, GET state and the current ingestion contract.
5. POST a truthful zero-item connectivity review with a unique runId and source
   details, GET state to verify it, then repeat the identical POST to verify replay.
6. Change the existing automation destination to these `/radar/api/observatory/*`
   routes and its authorized secret source. Remove all Sites-specific access
   instructions. Resume only after persistence is verified.

`npm test` runs unit and authorization tests. With `TEST_DATABASE_URL` pointing
to a disposable local PostgreSQL database named `ci`, it also checks concurrent
replay/deduplication, draft quotas, rollback, privacy filtering and the shared
article cap. CI supplies that database. Database tests intentionally reject
remote/production URLs and run serially because they share a test usage meter.
