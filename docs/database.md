# Content database

The current milestone serves the same historical preview from either fixtures or
PostgreSQL. It adds no ingestion, accounts, or public write endpoints.

## Daily local development

This Windows workstation uses native PostgreSQL 18, listening only on
`127.0.0.1:55438`. The persistent data directory is
`$env:LOCALAPPDATA\project-mina\postgres`, outside the repository and build caches.
`mina_development` holds development content; `mina_content_test` is separate and
reserved for the integration tests. Both use password authentication.

The ignored `.env.local` contains local `DATABASE_URL`, `TEST_DATABASE_URL`, and
`CONTENT_SOURCE=database`. `DATABASE_MIGRATION_URL` is unnecessary locally; scripts
fall back to `DATABASE_URL`. Previously entered Supabase settings are preserved
in ignored `.env.supabase.local`, which our normal development commands do not load.

After a computer restart, start the database in PowerShell:

```powershell
pg_ctl -D "$env:LOCALAPPDATA\project-mina\postgres" -l "$env:LOCALAPPDATA\project-mina\postgres.log" -w start
npm run dev
```

Run `npm run test:db` to test the separate test database. Stop the local database
when finished with:

```powershell
pg_ctl -D "$env:LOCALAPPDATA\project-mina\postgres" -m fast -w stop
```

Stopping the server preserves both databases. These local operations do not use
hosted Supabase. The existing Windows PostgreSQL service is left unchanged.

## Another local database / hosted Supabase setup

1. Copy the keys in `.env.example` into the ignored `.env.local`, preserving any
   existing values. Never commit connection credentials.
2. Set `DATABASE_URL` to the Supabase **transaction pooler** URL (port 6543).
   Set `DATABASE_MIGRATION_URL` to a **session pooler** URL (port 5432) or a
   reachable direct connection. Use the project's Connect panel for the actual
   host and username, URL-encode the password, and retain TLS certificate verification.
   Local PostgreSQL can use one URL for both roles, without TLS on loopback.
3. On a new development database, run `npm run db:migrate`, then `npm run db:seed`.
4. Set `CONTENT_SOURCE=database` and restart `npm run dev`.

`CONTENT_SOURCE=sample` (the default) keeps the preview usable without a database.
Database mode fails on connection/query errors; it never silently substitutes
fixtures. Only published topics marked `is_sample=true` appear in these prototype
pages, so the historical/AI-written labels stay accurate. Feed reads are capped
at 50 topics; pagination and live-content presentation come with ingestion.

The seed is transactional and repeatable: it inserts missing sample topics and
preserves existing topics and editorial changes. A non-sample slug collision
aborts the seed. It does not delete/reset any data.

## Schema and ownership

- `outlets`: publisher identity and website.
- `articles`: unique source URL, outlet, headline, author, publication date,
  short description, content kind, and optional thumbnail URL.
- `topics`: unique event slug, event date, summary, publication status, sample
  flag, optional representative image and announcement link.
- `subjects`: game, company, platform, storefront, or cross-cutting subject.
- `topic_articles` and `topic_subjects`: ordered many-to-many memberships.

Date-only fixtures remain PostgreSQL `date` values. Exact publication timestamps
can be added when ingestion supplies that precision. Image/announcement metadata
uses JSONB; entities and memberships use foreign keys. A topic needs only one
article, and can appear on multiple subject pages under the same topic URL.

`src/db/content-schema.ts` is the content schema source. Generate reviewed SQL
with `npm run db:generate -- --name=description`, then apply it with
`npm run db:migrate`. Use Drizzle as the sole migration history; do not also
apply these changes through Supabase migration tools or use `db:push` as the
normal workflow. Supabase's tools can inspect and diagnose the resulting schema.

The starter's `todos` schema/demo is retained separately. Content migrations do
not create, change, or remove that table. Do not apply an initial migration to
an existing content schema without first reconciling its migration history.

## Server boundary and access

UI → route loaders → `src/server/*.functions.ts` → `*.server.ts` → Drizzle.
TanStack Start enforces `.server.ts` import boundaries. Connection credentials
are read during a server call, never exposed through `VITE_` variables. Each
request closes its database client; Supabase's pooler handles shared connections.
We do not keep sockets in a cross-request global on Cloudflare Workers.

All six content tables have RLS enabled with **no public policies**. Browser
`anon`/`authenticated` access is denied even if Supabase grants table access.
The initial server connection uses database-owner credentials (local or Supabase),
which bypass RLS; the server queries explicitly filter published sample topics.
Do not treat RLS as protection against a bug in those owner-level queries. Before
a public launch, provision a restricted runtime database role, leaving migration
credentials separate. No database write server functions are exposed here.

For deployment, set runtime `DATABASE_URL` as a Cloudflare secret and
`CONTENT_SOURCE` as a Worker variable. Do not upload migration credentials.
Hyperdrive remains an optional deployment improvement; it is not configured by
this milestone. No cloud resources are provisioned by these scripts.

## Verification

`npm run test:db` requires `TEST_DATABASE_URL` pointing to a **disposable local**
database named `mina_content_test`. It applies migrations, seeds twice, and
checks relationships, ordering, publication filtering, uniqueness, and RLS.
It inserts test records, so it intentionally rejects hosted/other database URLs.
Use a local administrator connection: the access test creates a test role and
checks reads/writes after switching to that role.

The test uses real PostgreSQL; it does not validate Supabase-specific networking
or the hosted project's role configuration. Verify those after connecting the
development project.
