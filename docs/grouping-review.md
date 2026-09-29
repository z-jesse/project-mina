# Reviewed grouping examples

Reviewed September 28, 2026 using Eurogamer, PC Gamer, and VGC coverage. These are manual
editorial examples, not an automated classifier or a representative evaluation
set. Topic summaries were written with AI assistance and carry that label.

## Same announcement, different headlines

[Eurogamer](https://www.eurogamer.net/minecraft-the-sift-new-dimension-2027) and
[PC Gamer](https://www.pcgamer.com/games/survival-crafting/minecraft-is-getting-its-first-new-dimension-in-15-years-and-it-is-riotously-pink/)
both cover the reveal of Minecraft's new dimension, The Sift, at Minecraft Live
on September 26. Both were published on September 27, about 37 minutes apart.
The shared named announcement, platform targets, and release year establish the
match. The headlines disagree about how many years have passed since the previous
dimension; preserve the original headlines and avoid repeating that discrepancy
as an established fact in the topic summary.

Decision: one topic, anchored to the September 26 announcement. Articles are
initially ordered by publication time, not by outlet quality or votes.
See [the repeatable draft](examples/minecraft-sift-topic.json).

[VGC's report](https://www.videogameschronicle.com/news/minecraft-is-officially-getting-its-first-new-dimension-in-15-years/)
also leads with The Sift reveal. It mentions other Minecraft Live announcements,
but those do not change its main premise. Attach it to the existing topic.
Its September 27, 07:19 UTC publication precedes the other two articles, but it
was imported later: append its coverage without replacing the saved Eurogamer
image, changing the September 26 event date, or moving the topic in the feed.
Incidental mentions of a theme park or Switch release do not justify attaching
this article to every Minecraft event.

## Same game and weekend, different news

[Eurogamer's player-count report](https://www.eurogamer.net/minecraft-300000-new-players-daily-minecraft)
discusses an Xbox executive's statement about Minecraft's new players and sales.
It also mentions the dimension reveal, but its main news is a different claim.

Decision: do not attach it to The Sift topic. Leave it in the review inbox for a
separate editorial decision. Matching a game, date, or announcement event is not
sufficient when the main news differs.

## Same event, four-day reporting gap

[Eurogamer](https://www.eurogamer.net/gears-of-war-e-day-story-director-laid-off-xbox-cuts)
published on September 23 and
[PC Gamer](https://www.pcgamer.com/games/third-person-shooter/gears-of-war-story-director-laid-off-mere-days-after-e-day-went-gold/)
on September 27. Both refer to Juan Vaca's same LinkedIn layoff announcement.
Eurogamer dates the announcement to the previous evening, September 22.

Decision: one topic with a September 22 event date. Attaching the later report
must not turn this into a new layoff or reset the event date. A rigid one-day
matching window would miss this pair. See [the draft](examples/gears-story-director-topic.json).

## Related layoffs require a narrower premise

[Eurogamer's World's Edge report](https://www.eurogamer.net/age-of-empire-worlds-edge-studio-xbox-cuts)
and [PC Gamer's follow-up](https://www.pcgamer.com/gaming-industry/latest-xbox-layoffs-reportedly-devastated-age-of-empires-developer-and-canceled-its-next-game/)
describe cuts at the Age of Empires studio during the same broader Xbox
restructuring. The PC Gamer piece also reports a project cancellation, citing a
former employee. These are not coverage of Juan Vaca's departure.

Decision: leave these outside the Gears topic. They are candidates for a separate
World's Edge topic after review. Whether the cancellation constitutes a meaningful
update deserves its own decision; a later article alone is not a feed bump.

## One interview, three outlets, different framing

[VGC](https://www.videogameschronicle.com/news/microsoft-ceo-says-streamlining-of-xbox-business-is-great-to-see/),
[PC Gamer](https://www.pcgamer.com/gaming-industry/microsoft-ceo-says-xboxs-streamlining-process-is-great-to-see-following-its-most-recent-round-of-layoffs/),
and [Eurogamer](https://www.eurogamer.net/satya-nadella-xbox-streamlining-great-to-see-layoffs)
all cover Satya Nadella's remarks on Alex Heath's Sources podcast. Their shared
interview and remarks establish the match; a shared Microsoft/Xbox label alone
would not. VGC and Eurogamer principally report the remarks. PC Gamer adds
substantial critical interpretation, so this review classifies it as analysis.
That is an editorial content-type choice, not a quality or bias score.

Decision: a separate topic for these interview remarks, not an expansion of the
Gears layoff topic. Use September 26, the earliest publication date in this
reviewed coverage, as the date anchor; the interview's recording date is not
verified. All articles retain their exact publication timestamps. The order in
[the draft](examples/nadella-xbox-streamlining-topic.json) follows publication time.
Multiple reports of the same interview do not constitute three independent
confirmations of the company's claims.

## Same anniversary, separate announcements

[VGC's September 25 report](https://www.videogameschronicle.com/news/konami-is-celebrating-the-40th-anniversary-of-castlevania-with-a-big-retro-sale-and-a-free-game/)
covers a free Castlevania mobile game and anniversary sale.
[Its September 28 report](https://www.videogameschronicle.com/news/tour-dates-and-pre-order-times-officially-confirmed-for-castlevania-40th-anniversary-concert/)
announces concert dates and ticket-sale times, while mentioning the giveaway as
background. Both share Castlevania, Konami, an anniversary, and nearby dates.

Decision: keep the giveaway/sale and concert announcement separate. Leave both
in the inbox for separate publication decisions. A future Castlevania destination
can collect these topics without collapsing them into one discussion.

## What this changes next

- Review event identity and the underlying announcement, not just headline words.
- Use time as a candidate-search signal, not a hard same-day rule. These few cases
  do not establish a safe automatic matching window or threshold.
- Keep an outlet filter in the inbox: a combined newest-100 list can hide earlier
  reports from one publisher behind another publisher's volume.
- Preserve the event date, topic URL, and existing coverage when adding sources.
  The `attach`/`detach` commands now change coverage without unpublishing; editorial
  text, subject changes, and deliberate image replacements still use redrafting.
- Gather more reviewed matches and non-matches before automating. No recommendation
  engine, AI service, or schema change is justified by these examples alone.
- A short feed is not a complete history. A missing alternate source in the latest
  ten entries is not evidence that an outlet never covered the event.
