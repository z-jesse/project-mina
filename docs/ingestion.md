# Local RSS import and topic review

This milestone imports [Eurogamer's news RSS feed](https://www.eurogamer.net/feed/news),
[PC Gamer's RSS feed](https://www.pcgamer.com/rss/), and
[VGC's news RSS feed](https://www.videogameschronicle.com/category/news/feed/)
into local PostgreSQL.
Start the database and apply migrations using
[the database guide](database.md), then run:

```sh
npm run content -- import
npm run content -- import pc-gamer
npm run content -- import vgc
npm run content -- inbox
npm run content -- inbox eurogamer
npm run content -- inbox pc-gamer
npm run content -- inbox vgc
```

`import` defaults to Eurogamer; each command fetches only the selected outlet.
The importer reads at most 100 entries from one feed request, with a 20-second
timeout and a response limit of 1 MB for Eurogamer/VGC or 2 MB for PC Gamer. PC Gamer's
feed includes full bodies, so it needs the larger bounded response allowance;
those bodies are discarded. The importer stores headlines, links, authors, publication
timestamps, short plain-text descriptions, and optional image URLs. It does not
fetch article pages or store full article bodies. Descriptions are publisher
excerpts, capped at 320 characters, and are attributed on the topic page.
VGC supplies thumbnails inside its short RSS description. The parser reads the
quoted image URL as a fallback and keeps only the plain-text description; it
never renders the feed's HTML. Missing or unsafe image URLs are omitted.

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

Drafting also saves the first available image among attached articles, using import
time and then article ID to resolve the initial choice. It keeps that image on
subsequent saves, even if articles are reordered or older coverage arrives later.
A topic without an image picks one up on a later save when an attached article has
one. The feed and topic page share this persisted image; its caption links to the
supplying article. No image download, scoring, or AI selection is performed.

To deliberately replace a broken or unsuitable image, add `imageArticleUrl` to
the draft JSON, pointing to an attached article that has an image. Omit this
field on ordinary saves to preserve the existing choice. Imported images have
no invented dimensions or visual descriptions; the existing responsive image
layout provides the display size.

Publishing is a separate, deliberate review step. In database mode the feed and
topic URL then show the topic. Historical samples retain their labels, publisher
descriptions have source attribution, and exact article timestamps display in UTC.
The prototype remains `noindex, nofollow`; publishing here only changes local
database visibility, not a hosted site.

```sh
npm run content -- unpublish fortnite-five-nights-at-freddys-fortnitemares
```

Unpublishing returns the topic to draft and makes its public URL return 404.
Unpublish before revising its editorial text, subjects, or image choice through
`draft`, then review and publish it again. Article membership can be changed while
published using the commands below.
The example requires its article to have been imported; it may eventually roll
out of the publisher's current feed. Existing imports remain available locally.

Multi-outlet examples and their match/non-match reasoning are recorded in
[the grouping review](grouping-review.md). After importing all three feeds:

```sh
npm run content -- draft docs/examples/minecraft-sift-topic.json
npm run content -- publish minecraft-sift-dimension-announced
npm run content -- draft docs/examples/gears-story-director-topic.json
npm run content -- publish gears-e-day-story-director-layoff
npm run content -- draft docs/examples/nadella-xbox-streamlining-topic.json
npm run content -- publish nadella-xbox-streamlining-comments
```

These examples also require their original articles to remain available locally.
VGC's news feed contained only ten recent entries at review time; older examples
can roll out quickly. Keep previously imported articles for repeatable review.
PC Gamer's feed mixes news with opinions, guides, and other content; importing an
entry does not establish its kind or make it eligible for publication.

## Add or remove coverage while published

Review the imported article, then attach it to the existing event:

```sh
npm run content -- attach minecraft-sift-dimension-announced "https://www.videogameschronicle.com/news/minecraft-is-officially-getting-its-first-new-dimension-in-15-years/" reporting
npm run content -- attach gears-e-day-story-director-layoff "https://www.pcgamer.com/games/third-person-shooter/gears-of-war-story-director-laid-off-mere-days-after-e-day-went-gold/" reporting
```

The final argument is the article kind: `reporting`, `analysis`, `opinion`,
`rumor`, `review`, or `guide`. A previously reviewed article must retain its kind;
attaching it is not a way to reclassify it across other topics. New coverage is
appended, preserving the existing order. Repeating an attachment is a no-op.

To correct a grouping, remove only the topic's link to the article:

```sh
npm run content -- detach gears-e-day-story-director-layoff "https://www.pcgamer.com/games/third-person-shooter/gears-of-war-story-director-laid-off-mere-days-after-e-day-went-gold/"
```

The article remains stored and returns to the inbox if no topic still uses it.
Repeating removal is a no-op. Removing the last article is rejected. These commands
support drafts and published topics, but protect historical samples. The current
review workflow retains its limit of 20 articles per topic.

Both commands are transactional and lock the topic to serialize simultaneous
edits. They preserve publication status, topic URL, headline, summary, subjects,
event date, and feed position. An attachment fills an empty topic image when the
article supplies one; existing images and attribution remain unchanged. If a
removed article supplied the image, the result includes `imageSourceDetached:
true` as a reminder to review it and explicitly replace it if unsuitable.

These are local CLI operations, not public web endpoints. Updating a draft JSON
file is separate; a later full draft save still replaces membership with that
file's article list.

## Boundaries and checks

The command uses `DATABASE_URL` and refuses anything except a loopback connection
to `mina_development`. It never uses hosted migration credentials. No unauthenticated
web write endpoints, scheduler, automatic grouping, AI service, or admin UI are
added. Empty or failed images leave the text layout intact.

```sh
npm run test:import
npm run test:db
```

Parser tests use synthetic RSS; database tests use the separate local test database
and cover repeat imports, outlet-scoped GUIDs, outlet filtering, mixed-outlet
drafts, metadata preservation, draft visibility, atomic edits, publication,
image persistence, concurrent coverage attachment, last-article protection,
ordering, and unpublishing. They do not depend on the live feeds.
