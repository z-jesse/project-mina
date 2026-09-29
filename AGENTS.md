<!-- project-context:start -->
# Project Mina

## Status and purpose

`project-mina` is the repository codename. **Games Watchdog** is the leading product name; naming remains open. The repo has a TanStack Start news prototype, topic detail pages, a GTA VI game page, PostgreSQL-backed reads, a local RSS import/review workflow, and browser-local article voting. Accounts, shared voting, and comments are not implemented.

Build an easy-to-read gaming news discovery site. Help readers find an interesting event, understand what happened, and choose an article to read. Keep the experience simple; attribution and access to original coverage provide context. The public posture is constructive: "see the whole story."

## Intended experience

Coverage from different outlets is grouped into **topics**, each describing a specific real-world event. A topic detail page contains a headline, brief summary, date, relevant subject labels, and a readable list of articles with outlet attribution and direct source links. Short article descriptions should add useful information. Prioritize reading and discovery; avoid sales copy, repeated explanations, comparison grids, and unnecessary controls.

Use one representative image on the topic detail page, with source attribution, followed by a text-only article list. Avoid repeating similar artwork for every article within the same topic. Retain article thumbnail data and the reusable thumbnail component for feeds and other discovery pages, where images help distinguish different topics. Images remain optional; unavailable images should leave a readable text layout.

Choose a topic image from its first available imported article image and persist that choice. If several articles are attached at creation, use import order, with article ID as a tie-breaker. If none has an image, fill it on a later draft save when an attached article has one. Older publication dates, reordered coverage, and new articles must not replace an existing image. Retain the supplying outlet and article link for attribution. Allow explicit editorial replacement for broken or unsuitable images; do not add image ranking or AI selection.

The main feed presents one compact topic card per event. The main headline consistently opens the topic, including when it has only one article. Show the event headline, a short description, optional image, date, and one expandable article count. Use the same collapsed disclosure for one or many articles: “1 article · Eurogamer” or “3 articles.” Expanding it shows publisher links and article-specific thumbs-up/down controls; keep these out of the default collapsed card. Do not repeat the article count or add an outlet count elsewhere on the card. Topic pages retain full coverage and voting. Choosing a recommended quick-read article remains an open policy decision; do not infer quality from outlet size, raw vote totals, or the current article order. Keep the same topic identity as coverage grows and use the same browsing behavior on game and other discovery pages.

Show recent article publication times as elapsed minutes, hours, or days, with the exact timestamp available. Use calendar dates for older coverage and date-only records; do not invent a publication time from an event date or ingestion time.

Game pages and, as coverage grows, platform, company, and subject pages offer paths into the same topics. Following and personalization can come later. Comments are a future feature: one shared discussion belongs to a topic, regardless of how readers discover it. Topic pages remain accessible after leaving the latest feed; related updates can link to one another. The card headline is the topic link; do not repeat a “View topic” action on each card. Do not add inactive comment controls, invented discussion counts, empty comment sections, or separate game discussions to the prototype.

Quick discovery, open discussion, and community feedback are complementary parts of the product identity. Future comments belong to one topic discussion and may reference a specific article; separate article comment pages are not required. Article feedback uses thumbs-up and thumbs-down with separate visible counts, framed as helpful or unhelpful coverage. One reader can select one choice, switch it, or remove it. Votes attach to articles, not events, and represent community judgment rather than a factuality or bias verdict. Do not use votes to rank the feed yet. The current voting UI stores only the reader’s browser-local choice, explained in tooltips and accessible text, with no invented community totals; shared persistent voting follows accounts. Keep article cards free of repeated “Local preview” and RSS-description provenance labels; retain outlet attribution, source links, and provenance metadata.

First reports should eventually become eligible for the feed without waiting for another source or an editorial summary. This is a future publication workflow change; current imports still require explicit review and publication. Keep grouping, meaningful updates, and feed ranking as separate decisions. Keep article publication time, ingestion time, topic publication time, and meaningful update time conceptually distinct. Start with chronological discovery; later ranking can consider freshness, substantial updates, subject relevance, and engagement. A newly attached article or late recap should not automatically revive an old event. Validate grouping with real coverage before adding ranking infrastructure or automatic publication. See [the product decision notes](docs/product-direction.md) for rationale, implementation gaps, and the next milestones.

## Topic boundaries and site structure

The sample game page shows a name, brief description, and newest-first topics using the same list layout as the main feed. Topic subject labels link to destination pages where they exist. Keep distinct events separate and older topics accessible through the game page; reuse their existing topic URLs and article collections.

- A topic is a specific event such as a release delay, not an ongoing umbrella such as years of a game's development. A topic can start with one article; multiple outlets are not a publication requirement.
- Group articles that help readers understand the same event. Time proximity is an important matching signal alongside the event itself; shared game names or publication dates alone are insufficient. Direct analysis and reactions may join the announcement's topic. A later distinct event, such as a second delay, gets its own topic.
- Anchor a topic to a concrete event and its initial source coverage. Adding sources should not silently change the discussion's premise. Corrections and meaningful summary changes should eventually retain visible history; outdated comments remain part of the event's chronology. Topic merges or splits involving discussion require deliberate review.
- Group conservatively: prefer temporarily separate topics to a low-confidence merge of unrelated events. Use reviewed examples to evaluate matching. Retrieve a small set of recent candidates using deterministic signals first; only introduce embeddings or AI for demonstrated gaps. Do not assume every imported article needs a generated summary or repeated analysis of all prior coverage.
- Games → Topics → Articles is a useful browsing path, not a strict site-wide hierarchy. Topics can connect to games, platforms/storefronts (PC, Steam, Xbox), companies/studios (Nintendo, Microsoft, Bethesda), and cross-cutting subjects (layoffs, acquisitions, hardware).
- A topic can appear on several relevant destination pages while retaining one identity, article collection, and future discussion. Add connections when followers would reasonably want the event, not for incidental mentions.
- Begin with a simple news feed and game browsing. Expand navigation as coverage supports useful destination pages; avoid a large taxonomy menu or premature database abstractions.

## Product references

[Ground News](https://ground.news/) informs grouping coverage of the same event. Google's Full Coverage experience also informs collecting related articles around a story. Adapt these patterns to gaming news, with discovery and readable article lists taking priority over explicit source comparison. Political bias categories, visual design, and subscription models are not requirements.

Google News and Apple News are secondary references for discovery, personalization, and reading experience. These references inform direction; the product's business model remains open.

## Product principles

- Organize discovery around specific news events and their relevant games or other subjects.
- Show evidence and provenance. Keep credibility dimensions such as disclosure quality, correction history, and factual reliability separate and explainable; avoid a single opaque score.
- Treat community feedback as a signal, not an established fact. Contentious credibility claims need evidence and moderation.
- Distinguish reporting, analysis, opinion, rumor, reviews, and guides.
- Make generated summaries and classifications identifiable and correctable.
- Respect publishers through attribution, source links, metadata, and short excerpts. Full article reproduction requires permission.
- Keep the experience approachable. The visual direction is a friendly doodled watchdog with binoculars, readable news layouts, and accessible interactions. Keep branding restrained on reading pages.

## First useful version

Start with three to five outlets and validate this loop:

RSS/Atom ingestion → deduplicate articles → identify relevant subjects and content type → group related coverage into event topics → publish indexable topic pages → let readers discover topics and open original articles.

The sample feed → game → topic → original article flow and PostgreSQL foundation are established. The current milestone imports Eurogamer and PC Gamer RSS feeds locally, deduplicates article metadata, and uses explicit command-line drafting and publication to group reviewed articles into topics. Imports alone never publish. Keep historical samples and AI-assisted summaries labeled; keep an explicit sample mode for previewing without credentials. Local article-voting controls are a UI prototype only. Do not add scheduled imports, automatic grouping, authentication, AI services, or shared community features yet. Introduce deterministic matching and human correction before embeddings or LLM enrichment, and evaluate those against real grouping examples. See `docs/ingestion.md` for the local review workflow and `docs/grouping-review.md` for the first reviewed matches and non-matches.

Topic discussion and shared article feedback are core intended features, deferred while discovery and grouping are validated. Personalization, detailed ownership/disclosure records, author profiles, reputation systems, and critic-versus-player comparisons can follow. Do not build those systems merely to support the current prototype.

Use the local `attach`/`detach` commands to change article membership on a published topic without unpublishing. Preserve topic identity, editorial text, subjects, event date, feed position, and any existing image. An attachment may fill an empty image slot. Protect historical samples, reject removing the last article, and keep repeated operations idempotent. Full editorial revisions still use the draft/review workflow; no public write endpoints or automatic publication are implied.

## Architectural direction

- **Web application:** TanStack Start, React, Vite, and TanStack Router. Public discovery and topic pages should be indexable and server rendered where practical. Sample prototypes should be clearly labeled and excluded from indexing.
- **Interactive data:** TanStack Query for shared server state, refreshes, and feedback interactions; route loaders for initial page data.
- **UI:** Tailwind CSS and shadcn/ui.
- **Database:** PostgreSQL on Supabase, accessed through server-side services using Drizzle ORM. The initial content schema covers outlets, articles, event topics, article-topic membership, and relevant subject connections, including games. User, community, and transparency records grow with the features that need them.
- **Authentication:** Supabase Auth is planned for accounts and user-specific features.
- **Hosting and ingestion:** Cloudflare Workers via the official Vite plugin. Scheduled ingestion, enrichment, and clustering run separately from serving web requests, while sharing the domain model.
- **Supporting tools:** Zod, environment validation where appropriate, and Biome. Supabase `pgvector` remains an option when semantic matching proves useful.

These are directional choices, not instructions to implement the entire stack now. Detailed framework usage and coding practices belong in the relevant skills or technical documentation.

Keep a single package for now. Use `src/server/*.functions.ts` for TanStack server functions and `.server.ts` modules for database connections and queries; route loaders are isomorphic and must not query Postgres directly. Revisit workspaces when a separate ingestion app needs shared code; Turborepo is not a prerequisite. Drizzle-generated migrations are the content schema history. Load the installed Supabase and Postgres skills for database work, while retaining this project's Drizzle workflow. See `docs/database.md` for setup and access boundaries.

Use local PostgreSQL for everyday development and a separate disposable database for integration tests. Hosted Supabase is for deployment and explicit integration checks; it is not required for the current development loop. The local and hosted databases use the same content schema and migrations.

## Longer-term business direction

Explore voluntary support during validation, optional paid utility features once the product becomes habitual, and potentially aggregated data/API access later. Commercial relationships must be disclosed and must not influence credibility signals.
<!-- project-context:end -->

<!-- intent-skills:start -->
# TanStack Intent - before editing files, run the matching guidance command.
tanstackIntent:
  - id: "@tanstack/devtools#devtools-app-setup"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-app-setup"
    for: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
  - id: "@tanstack/devtools#devtools-marketplace"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-marketplace"
    for: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
  - id: "@tanstack/devtools#devtools-plugin-panel"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-plugin-panel"
    for: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
  - id: "@tanstack/devtools#devtools-production"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-production"
    for: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
  - id: "@tanstack/devtools-event-client#devtools-bidirectional"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-bidirectional"
    for: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
  - id: "@tanstack/devtools-event-client#devtools-event-client"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-event-client"
    for: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
  - id: "@tanstack/devtools-event-client#devtools-instrumentation"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-instrumentation"
    for: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
  - id: "@tanstack/devtools-vite#devtools-vite-plugin"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-vite#devtools-vite-plugin"
    for: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
  - id: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#lifecycle/migrate-from-nextjs"
    for: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
  - id: "@tanstack/react-start#react-start"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#react-start"
    for: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
  - id: "@tanstack/react-start#react-start/server-components"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#react-start/server-components"
    for: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
  - id: "@tanstack/router-core#router-core"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core"
    for: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
  - id: "@tanstack/router-core#router-core/auth-and-guards"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/auth-and-guards"
    for: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
  - id: "@tanstack/router-core#router-core/code-splitting"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/code-splitting"
    for: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
  - id: "@tanstack/router-core#router-core/data-loading"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/data-loading"
    for: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
  - id: "@tanstack/router-core#router-core/navigation"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/navigation"
    for: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
  - id: "@tanstack/router-core#router-core/not-found-and-errors"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/not-found-and-errors"
    for: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
  - id: "@tanstack/router-core#router-core/path-params"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/path-params"
    for: "Dynamic path segments ($paramName), splat routes ($ / _splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
  - id: "@tanstack/router-core#router-core/search-params"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/search-params"
    for: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
  - id: "@tanstack/router-core#router-core/ssr"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/ssr"
    for: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
  - id: "@tanstack/router-core#router-core/type-safety"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/type-safety"
    for: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
  - id: "@tanstack/router-plugin#router-plugin"
    run: "npx @tanstack/intent@latest load @tanstack/router-plugin#router-plugin"
    for: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
  - id: "@tanstack/start-client-core#start-core"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core"
    for: "Core overview for TanStack Start: tanstackStart() Vite plugin, getRouter() factory, root route document shell (HeadContent, Scripts, Outlet), client/server entry points, routeTree.gen.ts, tsconfig configuration. Entry point for all Start skills."
  - id: "@tanstack/start-client-core#start-core/auth-server-primitives"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/auth-server-primitives"
    for: "Server-side authentication primitives for TanStack Start: session cookies (HttpOnly, Secure, SameSite, __Host- prefix), session read/issue/destroy via createServerFn and middleware, OAuth authorization-code flow with state and PKCE, password-reset enumeration defense, CSRF for non-GET RPCs, rate limiting auth endpoints, session rotation on privilege change. Pairs with router-core/auth-and-guards for the routing side."
  - id: "@tanstack/start-client-core#start-core/deployment"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/deployment"
    for: "Deploy to Cloudflare Workers, Netlify, Vercel, Node.js/Docker, Bun, Railway. Selective SSR (ssr option per route), SPA mode, static prerendering, ISR with Cache-Control headers, SEO and head management."
  - id: "@tanstack/start-client-core#start-core/execution-model"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/execution-model"
    for: "Isomorphic-by-default principle, environment boundary functions (createServerFn, createServerOnlyFn, createClientOnlyFn, createIsomorphicFn), ClientOnly component, useHydrated hook, import protection, dead code elimination, environment variable safety (VITE_ prefix, process.env)."
  - id: "@tanstack/start-client-core#start-core/middleware"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/middleware"
    for: "createMiddleware, request middleware (.server only), server function middleware (.client + .server), context passing via next({ context }), sendContext for client-server transfer, global middleware via createStart in src/start.ts, middleware factories, method order enforcement, fetch override precedence."
  - id: "@tanstack/start-client-core#start-core/server-functions"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-functions"
    for: "createServerFn (GET/POST), validator (Zod or function), useServerFn hook, server context utilities (getRequest, getRequestHeader, setResponseHeader, setResponseStatus), error handling (throw errors, redirect, notFound), streaming, FormData handling, file organization (.functions.ts, .server.ts)."
  - id: "@tanstack/start-client-core#start-core/server-routes"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-routes"
    for: "Server-side API endpoints using the server property on createFileRoute, HTTP method handlers (GET, POST, PUT, DELETE), createHandlers for per-handler middleware, handler context (request, params, context), request body parsing, response helpers, file naming for API routes."
  - id: "@tanstack/start-server-core#start-server-core"
    run: "npx @tanstack/intent@latest load @tanstack/start-server-core#start-server-core"
    for: "Server-side runtime for TanStack Start: createStartHandler, request/response utilities (getRequest, setResponseHeader, setCookie, getCookie, useSession), three-phase request handling, AsyncLocalStorage context."
  - id: "@tanstack/virtual-file-routes#virtual-file-routes"
    run: "npx @tanstack/intent@latest load @tanstack/virtual-file-routes#virtual-file-routes"
    for: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."
  - id: "dotenv#dotenv"
    run: "npx @tanstack/intent@latest load dotenv#dotenv"
    for: "Load environment variables from a .env file into process.env for Node.js applications. Use when configuring apps with secrets, setting up local development environments, managing API keys and database uRLs, parsing .env file contents, or populating environment variables programmatically. Always use this skill when the user mentions .env, even for simple tasks like \"set up dotenv\" — the skill contains critical gotchas (encrypted keys, variable expansion, command substitution) that prevent common production issues."
  - id: "dotenv#dotenvx"
    run: "npx @tanstack/intent@latest load dotenv#dotenvx"
    for: "Use dotenvx to run commands with environment variables, manage multiple .env files, expand variables, and encrypt env files for safe commits and CI/CD."
<!-- intent-skills:end -->
