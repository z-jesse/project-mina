# Local RSS import and topic review

This milestone imports [Eurogamer's news RSS feed](https://www.eurogamer.net/feed/news)
and [PC Gamer's RSS feed](https://www.pcgamer.com/rss/) into local PostgreSQL.
Start the database and apply migrations using
[the database guide](database.md), then run:

```sh
npm run content -- import
npm run content -- import pc-gamer
npm run content -- inbox
npm run content -- inbox eurogamer
npm run content -- inbox pc-gamer
```

`import` defaults to Eurogamer; each command fetches only the selected outlet.
The importer reads at most 100 entries from one feed request, with a 20-second
timeout and a response limit of 1 MB for Eurogamer or 2 MB for PC Gamer. PC Gamer's
feed includes full bodies, so it needs the larger bounded response allowance;
those bodies are discarded. The importer stores headlines, links, authors, publication
timestamps, short plain-text descriptions, and optional image URLs. It does not
fetch article pages or store full article bodies. Descriptions are publisher
excerpts, capped at 320 characters, and are attributed on the topic page.

Article URLs lose tracking parameters and fragments. Unique URL and outlet/GUID
constraints prevent duplicates on repeated imports. Existing article metadata and
editorial changes are preserved; publisher corrections are not synced yet.
Entries without a valid headline, publication date, or selected-outlet HTTPS URL are
skipped and counted. Imported articles have no assumed content classification.

Importing creates **no topics**. The inbox lists up to 100 imported articles that
are not assigned to any topic, with outlet attribution. An optional outlet filter
applies before the 100-item limit. Assigning an article to a draft also removes it
from the inbox.

## Review and publish

Create a JSON file using [the first reviewed topic](examples/fortnitemares-topic.json)
as the shape. Select URLs from the inbox and read their linked coverage. Write
your own brief headline, feed description, and summary; identify AI-assisted
summaries with `summaryIsAi: true`. Choose the event date, relevant subjects, and
each article's content kind explicitly. Do not group unrelated events just
because they mention the same game. One article is enough to start a topic.

```sh
npm run content -- draft docs/examples/fortnitemares-topic.json
npm run content -- publish fortnite-five-nights-at-freddys-fortnitemares
```

Drafting is transactional and can be rerun to revise the same draft, including
article order and subject membership. It requires previously imported articles
and refuses to overwrite historical samples or published topics. Subject slugs
with conflicting names/kinds are rejected rather than silently changed.

Publishing is a separate, deliberate review step. In database mode the feed and
topic URL then show the topic. Historical samples retain their labels, publisher
descriptions have source attribution, and exact article timestamps display in UTC.
The prototype remains `noindex, nofollow`; publishing here only changes local
database visibility, not a hosted site.

```sh
npm run content -- unpublish fortnite-five-nights-at-freddys-fortnitemares
```

Unpublishing returns the topic to draft and makes its public URL return 404.
Unpublish before editing a published topic, then review and publish it again.
The example requires its article to have been imported; it may eventually roll
out of the publisher's current feed. Existing imports remain available locally.

Two multi-outlet examples and their match/non-match reasoning are recorded in
[the grouping review](grouping-review.md). After importing both feeds:

```sh
npm run content -- draft docs/examples/minecraft-sift-topic.json
npm run content -- publish minecraft-sift-dimension-announced
npm run content -- draft docs/examples/gears-story-director-topic.json
npm run content -- publish gears-e-day-story-director-layoff
```

These examples also require their original articles to remain available locally.
PC Gamer's feed mixes news with opinions, guides, and other content; importing an
entry does not establish its kind or make it eligible for publication.

## Boundaries and checks

The command uses `DATABASE_URL` and refuses anything except a loopback connection
to `mina_development`. It never uses hosted migration credentials. No unauthenticated
web write endpoints, scheduler, automatic grouping, AI service, or admin UI are
added. Image metadata is retained, but this first review command does not select
a representative topic image. Empty images leave the text layout intact.

```sh
npm run test:import
npm run test:db
```

Parser tests use synthetic RSS; database tests use the separate local test database
and cover repeat imports, outlet-scoped GUIDs, outlet filtering, mixed-outlet
drafts, metadata preservation, draft visibility, atomic edits, publication,
ordering, and unpublishing. They do not depend on the live feeds.
