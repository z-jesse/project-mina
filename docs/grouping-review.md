# First two-outlet grouping review

Reviewed September 28, 2026 using Eurogamer and PC Gamer coverage. These are manual
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
ordered by publication time for this example, not by outlet quality or votes.
See [the repeatable draft](examples/minecraft-sift-topic.json).

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
