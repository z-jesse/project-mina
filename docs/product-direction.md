# Discovery, topics, and community

Decision notes from the product discussion on September 28, 2026. These describe
the intended direction; the implementation gaps below are still outstanding.
Keep ongoing agent guidance in [AGENTS.md](../AGENTS.md).

## Product purpose

Help people discover gaming news quickly, examine coverage from different
publishers, and make sense of it together. Open discussion and article feedback
are part of the product identity, not incidental additions. Their purpose is to
make community judgment and its reasoning visible, not to assign an opaque
algorithmic verdict about an outlet's bias or credibility.

Ground News informs event-based coverage collections; Google News informs quick
article access and paths to alternate sources. We do not need to copy either
experience wholesale or assume we know their internal grouping systems.

## Feed and reading decisions

- One event occupies one compact feed entry. Repeated reporting should add
  coverage to that entry rather than crowd out other events.
- The main headline consistently opens the topic page, even with one article.
  Adding a second source must not change the primary link's destination.
- A card can show the event headline, short description, optional image,
  clearly defined date, and one article count. Avoid repeating an outlet count;
  publisher attribution appears in the reading choices. The same pattern applies to
  game and other subject feeds.
- The article count is the collapsed reading/feedback disclosure for all topics:
  “1 article · Eurogamer” or “3 articles.” Inside, publisher headlines link directly
  to original coverage and each article has its own voting controls. This replaces
  a separate count and “Read an article” action. A one-article topic also requires
  expansion before direct reading; that is the accepted consistency tradeoff.
  A multi-source quick-read selection policy is not decided. Current article
  order is editorial order, not a popularity or quality ranking.
- Topic pages retain full article coverage and voting. The feed's expanded
  disclosure offers compact article rows, with votes beside them on wider screens
  and underneath on mobile. Making every article votable does not require showing
  every article in the default collapsed feed.
- Retain one representative topic image and a text-only article list. Article
  thumbnail metadata remains useful for discovery. Missing images are acceptable.
  Persist the first available attached image in import order and retain its
  attribution. Fill image-free topics when coverage supplies an image, but do not
  replace an existing choice due to article order or an older publication date.
  Explicit editorial replacement is available through the draft workflow.
- Recent article times use elapsed minutes, hours, or days, with exact dates
  available. Do not turn a date-only event record into an invented timestamp.

The accepted tradeoff is an extra step for readers who enter through the topic
headline. That step should provide useful coverage choices and, eventually,
discussion. Explicit quick-read links provide a shortcut.

## Discussion and article feedback

One discussion belongs to each topic across all discovery paths. A comment can
discuss the event generally or reference a particular article. Future “Discuss
this article” actions can open the shared discussion with that article selected;
separate article pages and isolated comment sections are not prerequisites.

Votes belong to individual articles. Use thumbs-up and thumbs-down, with separate
counts and “helpful/unhelpful article” labels. A reader has one active choice and
can switch or remove it. Separate totals preserve disagreement that a net score
would hide. Explanations are optional, through discussion or future specific
feedback actions.

Votes express community sentiment, not a proven accuracy finding. Do not use
them to rank the main feed yet. Featuring an article gives it more exposure and
votes; using those raw totals to keep it featured would reinforce that exposure.
Shared voting, moderation, and manipulation protections require their own design
when accounts are introduced.

## Stable events and evolving coverage

A topic describes a concrete event, not an indefinitely expanding talking point.
It can begin with one report and its clearly attributed headline; generating a
new summary is not inherently necessary to establish a discussion home. This
lighter publication path is a future capability, not the current CLI behavior.

| Incoming coverage | Intended treatment |
| --- | --- |
| Another outlet reports the same GTA delay | Add coverage; do not automatically bump the feed position. |
| An interview explains that delay | Usually attach to the event; separately assess whether it adds a meaningful update. |
| A correction changes the reported date | Make the correction visible and preserve the earlier context. |
| A second delay is announced months later | Create a new topic and relate it to the earlier event. |
| An article shares the game name but concerns another event | Keep it separate. |
| Evidence is insufficient to identify the event | Keep separate or hold for review rather than force a match. |

Adding coverage must not silently redefine what existing comments refer to.
Comments may become outdated as facts develop; their timestamps, article
references, and a future visible update history preserve context. Merging or
splitting topics with existing discussion needs deliberate review. The exact
comment-preservation behavior remains to be designed.

## Grouping, updates, and ranking

These are separate decisions:

1. **Grouping:** does the article report or directly explain this event?
2. **Updating:** does it add meaningful information or correct earlier reporting?
3. **Ranking:** should the topic receive renewed attention in the feed?

Article publication time, ingestion time, topic publication time, and meaningful
update time have different meanings. A new article alone must not reset the
event's age. Start with chronological topic discovery; define update and ranking
rules before using engagement or personalization.

Our proposed automation approach is incremental: find a small set of recent
candidates using subjects, time proximity, headline similarity, and shared
announcement links; attach confident matches and review ambiguous cases. None
of those signals alone proves two articles concern the same event.

Prefer temporary duplication over combining unrelated discussions. Capture real
examples of matches, non-matches, corrections, and later developments from the
first outlets. Evaluate both missed matches and incorrect groupings. Embeddings
or language models can be added for demonstrated gaps; per-article AI generation
and repeated reprocessing of all coverage are not requirements. Actual processing
cost, review effort, and publication delay must be measured, not assumed.

## What exists today

- Sample and database-backed feeds, topic pages, and a GTA VI page.
- A shared search header and Home / For You / Saved navigation. For You is a
  labeled placeholder. URL-backed search and subject filters narrow the latest
  50 published stories, including article headlines and outlet names; common
  GTA 6 aliases are supported. The Explore row uses subjects with actual coverage,
  without claiming they are trending.
- Browser-local saved topics (up to 100), with controls on feed cards and topic
  pages. Saved retrieves current published data outside the latest-feed window;
  removed or unpublished topics offer bookmark removal. Saves are not account
  synced and last only for the page session when storage is unavailable.
- Three-outlet local RSS import (Eurogamer, PC Gamer, and VGC), metadata deduplication, and explicit CLI topic
  drafting/publication. Imports alone do not create topics or publish articles.
- Required editorial headline, description, and summary in the draft workflow.
  Published editorial edits require unpublishing; there is no revision history.
  Imported articles can be attached or detached while the topic stays published,
  preserving its identity, image, event date, and feed position. The last article
  cannot be removed; duplicate operations are no-ops.
- Feed ordering by event date, then topic ID; no recommendation engine or
  meaningful-update ranking. Precise article timestamps exist for RSS imports.
- Browser-local votes with separate zero/one counts and persistence where storage
  is available. Tooltips and accessible text explain the local behavior; repeated
  preview and RSS-description labels are omitted from article cards. Outlet
  attribution and source links remain. No community totals or server writes.
- Compact topic cards on the main feed and game page. All primary headlines open
  topics. A single expandable article count exposes source links and local votes
  for one or many articles, in existing editorial order without a featured-source
  recommendation.
- Cards show the event date consistently; precise relative article publication
  times remain on topic pages. No fabricated topic publication times.

The existing TanStack Start, PostgreSQL/Supabase, Drizzle, and planned Supabase
Auth direction still fits. This discussion does not call for another database,
a monorepo, new infrastructure, or immediate community tables.

## Next focused milestones

1. **Review the compact feed prototype (implemented).** Check one-source,
   multi-source, and image-free cards on feed and game pages. Headlines consistently
   open topics, full coverage and voting remain on topic pages, and expanding the
   article count offers direct reading and voting without a community recommendation.
2. **Validate grouping with real coverage.** Extend the small outlet set and record
   reviewed event groupings and ambiguous examples before building automatic
   matching. Preserve the manual publication boundary during that evaluation.
   [The grouping review](grouping-review.md) records same-event matches,
   same-game and same-anniversary non-matches, interview framing, and delayed reporting; it is a starting set, not a
   validated automatic matching policy.
3. **Implement a narrow community slice.** Accounts and persistent article votes,
   then shared topic discussion with article references. Scope moderation and
   correction behavior with these features rather than adding a reputation score.

Open decisions include how to choose a multi-source quick-read article, how much
evidence is sufficient for a match, what deserves an update/bump, and how to
preserve discussion through topic merges or splits. No featured-source ranking,
AI provider, automation threshold, or operating-cost estimate is committed here.
