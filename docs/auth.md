# Local authentication development

The app supports email-code sign-in, sign-out, and persistent article votes in
database mode. Local Supabase Auth runs independently of the content database.
Reading stays public. Clicking a vote while signed out opens sign-in and returns
to the reading page; it does not submit a vote automatically.
Sample mode retains explicitly labeled browser-local voting. Previous browser
choices are never imported into shared totals. Bookmarks remain browser-local.

## Services

- The website runs normally with `npm run dev` on port 3000.
- Native PostgreSQL remains on `127.0.0.1:55438` for content and content tests.
- Docker runs Supabase Auth, its API gateway, its own PostgreSQL database on
  port 54322, and Mailpit. Auth needs this separate database for its managed schema.
- Auth API: `http://127.0.0.1:54321`.
- Test email inbox: [Mailpit](http://127.0.0.1:54324).

Storage, Realtime, Studio, the Data API, analytics, Edge Functions, and the
connection pooler are disabled. The Supabase database does not contain the news
tables. Continue using Drizzle and the existing `db:*` commands for content;
Supabase migrations and seeds are disabled in this local configuration.

No hosted project is linked. Test emails stay in Mailpit; local Auth requests do
not consume hosted Supabase usage. See the [Supabase local development guide](https://supabase.com/docs/guides/local-development).

## Start and stop

On this workstation Docker Desktop is installed per-user with its WSL 2 backend.
No Windows restart was needed. Open Docker Desktop before starting Auth. A new
terminal may be needed after installation for `docker` to appear on PATH.

```powershell
npm run auth:start
npm run auth:status
npm run test:auth-local
```

`auth:status` includes local credentials; don't paste its full output into issues
or commit it. In ignored `.env.local`, set `APP_ORIGIN=http://localhost:3000`,
`SUPABASE_URL=http://127.0.0.1:54321`, and `SUPABASE_PUBLISHABLE_KEY` to the local
publishable key. This workstation is already configured. Use `localhost:3000`
consistently in the browser: mutations enforce the exact configured origin.
Restart Vite after environment changes. Never replace the existing content
`DATABASE_URL` with the Auth database URL. Apply `npm run db:migrate` for the
article-votes table; migrations preserve existing coverage.

Open [Sign in](http://localhost:3000/sign-in), enter an email, and copy its code
from Mailpit. Local development does not send the email to your real inbox.

Stop the Auth stack when finished:

```powershell
npm run auth:stop
```

Stopping preserves Auth data. Do not add `--no-backup`: that deletes volumes.
Docker Desktop can then be closed. Native PostgreSQL and the website have their
own start/stop commands, described in [database.md](database.md).

## First setup on another machine

Install Docker Desktop, start its Linux engine, and run `npm install`. The repo
pins the Supabase CLI version; no global CLI installation or Supabase login is
needed. Create the project network once:

```powershell
docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 project-mina-local
npm run auth:start
```

In Docker Desktop, set **Settings → Resources → Network → Port binding behavior**
to **Localhost by default**. On this Windows installation, the bridge network
option alone did not restrict Desktop's host listeners. That Desktop default has
already been set here; a backup of its previous settings is beside
`%APPDATA%\Docker\settings-store.json` as `settings-store.before-mina.json`.
This is a Docker-wide default; explicitly requested interface bindings can still
override it. See [Docker's networking documentation](https://docs.docker.com/desktop/features/networking/).

Verify `docker ps` shows `127.0.0.1` / `::1` for ports 54321, 54322, and 54324,
not `0.0.0.0` / `::`. Use `npm run auth:start` so the project network and excluded
services are applied consistently.

## Email codes and verification

`supabase/config.toml` requires email confirmation and uses six-digit codes that
expire after 10 minutes. Both new-account and returning-user email templates use
`supabase/templates/sign-in.html`. Repeat sends to the same address have a
one-minute cooldown. No external SMTP provider is configured.

`npm run test:auth-local` refuses non-local API/inbox addresses. It requests a code
for a generated test address, reads the captured email, verifies the code, checks
that it cannot be reused, refreshes the session, and checks that signing out
revokes refresh access. It removes its test account and email. This verifies the
local provider independently of the application.

With `npm run dev` on port 3000, `npm run test:auth-http` also exercises the actual
TanStack server-function endpoints. It checks two independent accounts, code
reuse, HttpOnly cookie flags, session refresh, signed-out and cross-site write
rejection, ignored client-supplied user IDs, idempotent votes, switching/removal,
and sign-out including replay of a revoked cookie. It discovers RPC identifiers
from Vite's transformed modules, so run it against the development server. Its
guards require local Auth and `mina_development`; it cleans up its test votes,
accounts, and emails. `npm run test:db` separately tests vote constraints,
publication filtering, ownership, and RLS on disposable `mina_content_test`.

## Session and vote boundaries

Auth clients are created per request in `src/server/auth.server.ts`. Supabase
stores sessions in HttpOnly, SameSite=Lax cookies, with Secure and a `__Host-`
prefix on HTTPS. HTTP is accepted only for local app origins. Tokens are never
stored in browser localStorage or returned to UI code. `getUser()` verifies
identity with the Auth service; a cookie user object is never trusted. Auth and
personalized vote responses use private/no-store caching. Auth status loads
after hydration, leaving public reading HTML independent of accounts.

Every mutation checks the configured full origin. Votes additionally require a
verified account and published article. One `(article_id, user_id)` row stores
`1` or `-1`; removing a vote deletes only that account's row. Absolute choices
make retries idempotent. Reads return counts and the reader's own choice, never
other voters' identities. Pages batch article feedback in one request, and
pending controls prevent duplicate clicks. Votes do not affect feed ordering.

The content database stores the verified Supabase user UUID directly. There is
no cross-database foreign key to `auth.users`, or duplicate profile/email table.
Account deletion is not exposed yet; a future deletion workflow must also
remove or anonymize that account's content-database records.

## Before hosted deployment

This milestone is verified locally; no hosted Auth settings were changed.
Configure HTTPS `APP_ORIGIN`, the hosted API URL and publishable key on the
server, and the matching code templates/expiry in Supabase. Use a configured
SMTP provider for real delivery (the local Mailpit setup is not a hosted mail
service). Keep service-role keys out of application runtime configuration.

Supabase applies its configured Auth limits and email cooldowns. Because Auth
requests currently pass through the web server, add per-client edge rate limits
and evaluate abuse protection before a public launch; provider IP limits alone
can group readers behind one server. Provision a restricted content runtime
database role as described in `database.md`. Public rollout, moderation,
account deletion, and manipulation-resistant ranking remain separate work.
