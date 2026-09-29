import assert from 'node:assert/strict'
import { test } from 'node:test'
import { config } from 'dotenv'
import { eq, inArray, sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { seedContent } from '../scripts/seed-content'
import {
  inbox,
  saveDraft,
  setPublication,
  updateCoverage,
} from '../scripts/editorial'
import { importNews, parseNewsFeed, pcgamer, vgc } from '../scripts/rss'
import { pcGamerFeed, testFeed, vgcFeed } from './fixtures/rss'
import { sampleTopics } from '../src/data/sample-topics'
import { withDatabase } from '../src/db/client.server'
import {
  articles,
  subjects,
  topicArticles,
  topics,
  topicSubjects,
} from '../src/db/content-schema'
import { findTopic, getGtaGame, listTopics } from '../src/server/topics.server'

config({ path: ['.env.local', '.env'], quiet: true })

const connectionString = process.env.TEST_DATABASE_URL
if (!connectionString)
  throw new Error(
    'Set TEST_DATABASE_URL to a disposable local mina_content_test database.',
  )
const url = new URL(connectionString)
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/mina_content_test'
) {
  throw new Error('Database tests only run against local mina_content_test.')
}
process.env.DATABASE_URL = connectionString
process.env.CONTENT_SOURCE = 'database'

test('content migration, seed, queries, and access boundaries', async (t) => {
  await withDatabase(async (db) => {
    await migrate(db, { migrationsFolder: './drizzle' })
    await migrate(db, { migrationsFolder: './drizzle' })
    await seedContent(db)
    assert.equal(await seedContent(db), 0)
  })

  await t.test(
    'fixture round-trip preserves sources, order, images, and relationships',
    async () => {
      const actual = await listTopics()
      // JSON transport omits undefined; formatting dates does not change their meaning.
      const normalize = (items: typeof sampleTopics) =>
        JSON.parse(
          JSON.stringify(
            items.map(({ dateLabel: _, ...topic }) => ({
              ...topic,
              articles: topic.articles.map(
                ({ dateLabel: __, ...article }) => article,
              ),
            })),
          ),
        )
      assert.deepEqual(normalize(actual), normalize(sampleTopics))
      assert.equal(
        (await findTopic('gta-6-may-2026-delay'))?.articles.length,
        3,
      )
      assert.equal((await findTopic('ea-respawn-job-cuts'))?.image, undefined)
      assert.equal(await findTopic('missing-topic'), undefined)
      assert.equal(await findTopic("' OR 1=1 --"), undefined)
      const game = await getGtaGame()
      assert.deepEqual(
        game?.topics.map((topic) => topic.slug),
        ['gta-6-second-trailer', 'gta-6-may-2026-delay', 'gta-6-first-trailer'],
      )
    },
  )

  await t.test('reseeding preserves editorial changes', async () => {
    await withDatabase(async (db) => {
      const fixture = sampleTopics[0]
      try {
        await db
          .update(topics)
          .set({ title: 'An edited headline' })
          .where(eq(topics.slug, fixture.slug))
        await seedContent(db)
        assert.equal(
          (await findTopic(fixture.slug))?.title,
          'An edited headline',
        )
      } finally {
        await db
          .update(topics)
          .set({ title: fixture.title })
          .where(eq(topics.slug, fixture.slug))
      }
    })
  })

  await t.test(
    'drafts stay hidden, published topics appear, and membership allows shared topics',
    async () => {
      await withDatabase(async (db) => {
        const inserted = await db
          .insert(topics)
          .values([
            {
              slug: 'test-draft',
              title: 'Draft',
              eventDate: '2099-01-01',
              description: '',
              summary: '',
              isSample: true,
            },
            {
              slug: 'test-live',
              title: 'Live',
              eventDate: '2099-01-02',
              description: '',
              summary: '',
              status: 'published',
            },
          ])
          .returning()
        try {
          assert.equal((await listTopics()).length, sampleTopics.length + 1)
          assert.equal(await findTopic('test-draft'), undefined)
          assert.equal((await findTopic('test-live'))?.isSample, false)
          const [gta] = await db
            .select()
            .from(subjects)
            .where(eq(subjects.slug, 'grand-theft-auto-vi'))
          const [rockstar] = await db
            .select()
            .from(subjects)
            .where(eq(subjects.slug, 'rockstar-games'))
          const [article] = await db.select().from(articles).limit(1)
          await db.insert(topicSubjects).values([
            { topicId: inserted[0].id, subjectId: gta.id, position: 0 },
            { topicId: inserted[0].id, subjectId: rockstar.id, position: 1 },
          ])
          await db.insert(topicArticles).values({
            topicId: inserted[0].id,
            articleId: article.id,
            position: 0,
          })
          assert.equal((await getGtaGame())?.topics.length, 3)
          await assert.rejects(
            db.insert(topicArticles).values({
              topicId: inserted[0].id,
              articleId: article.id,
              position: 1,
            }),
          )
          await assert.rejects(
            db.insert(articles).values({
              outletId: article.outletId,
              url: article.url,
              title: article.title,
              publishedDate: article.publishedDate,
              description: article.description,
            }),
          )
        } finally {
          await db.delete(topics).where(
            inArray(
              topics.id,
              inserted.map((row) => row.id),
            ),
          )
        }
        assert.equal(
          (await db.select().from(articles)).length,
          sampleTopics.reduce(
            (count, topic) => count + topic.articles.length,
            0,
          ),
        )
        assert.equal(
          (
            await db
              .select()
              .from(topicSubjects)
              .where(
                inArray(
                  topicSubjects.topicId,
                  inserted.map((row) => row.id),
                ),
              )
          ).length,
          0,
        )
      })
    },
  )

  await t.test(
    'import, repeat import, draft review, publish, and unpublish',
    async () => {
      await withDatabase(async (db) => {
        const feed = await parseNewsFeed(testFeed)
        const first = feed.items[0]
        // Identical GUIDs from different outlets must remain separate articles.
        const otherFeed = await parseNewsFeed(pcGamerFeed, pcgamer)
        const second = otherFeed.items[0]
        second.imageUrl = 'https://images.example.com/second.jpg'
        second.publishedAt = new Date('2026-09-24T08:30:00Z')
        second.publishedDate = '2026-09-24'
        const urls = [first.url, second.url]
        const topicSlug = 'mina-test-reviewed-event'
        const draft = {
          slug: topicSlug,
          title: 'Test event',
          eventDate: '2026-09-25',
          description: 'A reviewed description.',
          summary: 'A reviewed topic summary.',
          summaryIsAi: true,
          subjects: [
            {
              slug: 'grand-theft-auto-vi',
              name: 'Grand Theft Auto VI',
              kind: 'game',
            },
          ],
          articles: [
            { url: first.url, kind: 'reporting' },
            { url: second.url, kind: 'analysis' },
          ],
        }
        try {
          assert.deepEqual(
            await importNews(db, { ...feed, items: [first, first] }),
            { inserted: 1, duplicates: 1, skipped: 0 },
          )
          assert.deepEqual(await importNews(db, otherFeed), {
            inserted: 1,
            duplicates: 0,
            skipped: 0,
          })
          assert.deepEqual(await importNews(db, otherFeed), {
            inserted: 0,
            duplicates: 1,
            skipped: 0,
          })
          assert.deepEqual(await importNews(db, feed), {
            inserted: 0,
            duplicates: 1,
            skipped: 0,
          })
          assert.equal(
            (
              await importNews(db, {
                ...feed,
                items: [
                  {
                    ...first,
                    url: 'https://www.eurogamer.net/renamed-test-url',
                  },
                ],
                skipped: 0,
              })
            ).inserted,
            0,
          )
          assert.equal(
            (
              await importNews(db, {
                ...feed,
                items: [{ ...first, feedGuid: 'changed-guid' }],
                skipped: 0,
              })
            ).inserted,
            0,
          )
          assert.equal((await listTopics()).length, sampleTopics.length)
          assert.ok((await inbox(db)).some((row) => row.url === first.url))
          const pcInbox = await inbox(db, 'pc-gamer')
          assert.deepEqual(
            pcInbox.map((row) => row.url),
            [second.url],
          )
          assert.equal(pcInbox[0].outlet, 'PC Gamer')
          assert.equal((await inbox(db, 'eurogamer'))[0].url, first.url)
          const [stored] = await db
            .select()
            .from(articles)
            .where(eq(articles.url, second.url))
          assert.equal(stored.feedUrl, pcgamer.feedUrl)
          await db
            .update(articles)
            .set({ title: 'Editorial correction' })
            .where(eq(articles.url, first.url))
          await importNews(db, feed)
          assert.equal(
            (
              await db
                .select()
                .from(articles)
                .where(eq(articles.url, first.url))
            )[0].title,
            'Editorial correction',
          )
          await assert.rejects(
            saveDraft(db, { ...draft, slug: sampleTopics[0].slug }),
          )
          await assert.rejects(
            saveDraft(db, {
              ...draft,
              articles: [
                {
                  url: 'https://www.eurogamer.net/not-imported',
                  kind: 'reporting',
                },
              ],
            }),
          )
          await saveDraft(db, draft)
          assert.equal(await findTopic(topicSlug), undefined)
          assert.ok(!(await inbox(db)).some((row) => urls.includes(row.url)))
          // A failed edit must roll back membership changes as well as topic text.
          await assert.rejects(
            saveDraft(db, {
              ...draft,
              title: 'Bad edit',
              subjects: [
                {
                  slug: 'grand-theft-auto-vi',
                  name: 'Wrong name',
                  kind: 'company',
                },
              ],
            }),
          )
          await setPublication(db, topicSlug, true)
          const published = await findTopic(topicSlug)
          assert.equal(published?.title, draft.title)
          assert.equal(published?.isSample, false)
          assert.equal(published?.summaryIsAi, true)
          assert.equal(published?.image?.src, first.imageUrl)
          assert.equal(published?.image?.sourceUrl, first.url)
          assert.equal(published?.image?.sourceName, 'Eurogamer')
          assert.deepEqual(
            published?.articles.map((a) => a.url),
            urls,
          )
          assert.equal(published?.articles[0].date, '2026-09-25T08:30:00.000Z')
          assert.equal(published?.articles[0].descriptionSource, 'publisher')
          assert.deepEqual(
            published?.articles.map((article) => article.outlet),
            ['Eurogamer', 'PC Gamer'],
          )
          assert.equal((await getGtaGame())?.topics.length, 4)
          await assert.rejects(saveDraft(db, draft))
          await setPublication(db, topicSlug, false)
          assert.equal(await findTopic(topicSlug), undefined)
          await saveDraft(db, {
            ...draft,
            articles: [...draft.articles].reverse(),
          })
          await setPublication(db, topicSlug, true)
          assert.deepEqual(
            (await findTopic(topicSlug))?.articles.map((a) => a.url),
            [...urls].reverse(),
          )
          assert.deepEqual(
            (await findTopic(topicSlug))?.image,
            published?.image,
          )

          // An intentional override can replace an image; invalid choices cannot.
          await setPublication(db, topicSlug, false)
          await assert.rejects(
            saveDraft(db, {
              ...draft,
              imageArticleUrl: 'https://www.eurogamer.net/not-attached',
            }),
          )
          await saveDraft(db, { ...draft, imageArticleUrl: second.url })
          await setPublication(db, topicSlug, true)
          assert.equal(
            (await findTopic(topicSlug))?.image?.src,
            second.imageUrl,
          )
          assert.equal(
            (await findTopic(topicSlug))?.image?.sourceName,
            'PC Gamer',
          )

          // A topic can start without an image, then acquire one as coverage grows.
          await setPublication(db, topicSlug, false)
          await db
            .update(topics)
            .set({ image: null })
            .where(eq(topics.slug, topicSlug))
          await db
            .update(articles)
            .set({ imageUrl: null })
            .where(eq(articles.url, first.url))
          await saveDraft(db, { ...draft, articles: [draft.articles[0]] })
          await setPublication(db, topicSlug, true)
          assert.equal((await findTopic(topicSlug))?.image, undefined)
          await setPublication(db, topicSlug, false)
          await saveDraft(db, draft)
          await setPublication(db, topicSlug, true)
          assert.equal(
            (await findTopic(topicSlug))?.image?.src,
            second.imageUrl,
          )
          assert.equal((await findTopic(topicSlug))?.date, draft.eventDate)

          // Coverage edits leave the live topic's identity and editorial text intact.
          const beforeCoverage = await findTopic(topicSlug)
          const beforeOrder = (await listTopics()).map((topic) => topic.slug)
          const detach = { action: 'detach', slug: topicSlug, url: second.url }
          const removed = await updateCoverage(db, detach)
          assert.equal(removed.changed, true)
          assert.equal(removed.status, 'published')
          assert.ok(
            'imageSourceDetached' in removed && removed.imageSourceDetached,
          )
          assert.equal((await updateCoverage(db, detach)).changed, false)
          assert.ok((await inbox(db)).some((row) => row.url === second.url))
          await assert.rejects(
            updateCoverage(db, { ...detach, url: first.url }),
          )
          await assert.rejects(
            updateCoverage(db, { ...detach, slug: sampleTopics[0].slug }),
          )
          await assert.rejects(
            updateCoverage(db, { ...detach, slug: 'missing-topic' }),
          )
          const attach = {
            action: 'attach',
            slug: topicSlug,
            url: second.url,
            kind: 'analysis',
          }
          await assert.rejects(
            updateCoverage(db, { ...attach, kind: 'reporting' }),
          )
          await assert.rejects(
            updateCoverage(db, {
              ...attach,
              url: 'https://www.eurogamer.net/not-imported',
            }),
          )
          const added = await Promise.all([
            withDatabase((connection) => updateCoverage(connection, attach)),
            withDatabase((connection) => updateCoverage(connection, attach)),
          ])
          assert.deepEqual(added.map((result) => result.changed).sort(), [
            false,
            true,
          ])
          assert.deepEqual(await findTopic(topicSlug), beforeCoverage)
          assert.deepEqual(
            (await listTopics()).map((topic) => topic.slug),
            beforeOrder,
          )
          assert.ok(!(await inbox(db)).some((row) => row.url === second.url))

          // Attaching coverage fills a previously empty image without changing date.
          await updateCoverage(db, detach)
          await db
            .update(topics)
            .set({ image: null })
            .where(eq(topics.slug, topicSlug))
          await updateCoverage(db, attach)
          assert.equal(
            (await findTopic(topicSlug))?.image?.src,
            second.imageUrl,
          )
          assert.equal((await findTopic(topicSlug))?.date, draft.eventDate)
        } finally {
          await db.delete(topics).where(eq(topics.slug, topicSlug))
          await db.delete(articles).where(inArray(articles.url, urls))
        }
      })
    },
  )

  await t.test(
    'VGC imports reuse the seeded outlet without changing historical topics',
    async () => {
      await withDatabase(async (db) => {
        const before = await listTopics()
        const feed = await parseNewsFeed(vgcFeed, vgc)
        try {
          assert.deepEqual(await importNews(db, feed), {
            inserted: 1,
            duplicates: 0,
            skipped: 0,
          })
          assert.deepEqual(await importNews(db, feed), {
            inserted: 0,
            duplicates: 1,
            skipped: 0,
          })
          const pending = await inbox(db, 'vgc')
          assert.equal(pending.length, 1)
          assert.equal(pending[0].outlet, 'VGC')
          const [stored] = await db
            .select()
            .from(articles)
            .where(eq(articles.url, feed.items[0].url))
          assert.equal(stored.feedUrl, vgc.feedUrl)
          assert.equal(stored.imageUrl, feed.items[0].imageUrl)
          assert.equal(stored.kind, null)
          assert.deepEqual(await listTopics(), before)
        } finally {
          await db.delete(articles).where(eq(articles.url, feed.items[0].url))
        }
      })
    },
  )

  await t.test(
    'RLS denies public-role reads and writes even when table grants exist',
    async () => {
      await withDatabase(async (db) => {
        const result = await db.execute<{
          relname: string
          relrowsecurity: boolean
        }>(sql`
        select relname, relrowsecurity from pg_class
        where oid in ('articles'::regclass, 'outlets'::regclass, 'subjects'::regclass,
          'topics'::regclass, 'topic_articles'::regclass, 'topic_subjects'::regclass)
      `)
        assert.equal(result.rows.length, 6)
        assert.ok(result.rows.every((row) => row.relrowsecurity))
        await db.execute(sql`do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'mina_test_reader') then
          create role mina_test_reader;
        end if;
      end $$`)
        await db.execute(sql`grant usage on schema public to mina_test_reader`)
        await db.execute(
          sql`grant select, insert, update, delete on all tables in schema public to mina_test_reader`,
        )
        await db.execute(
          sql`grant usage on all sequences in schema public to mina_test_reader`,
        )
        await db.transaction(async (tx) => {
          await tx.execute(sql`set local role mina_test_reader`)
          assert.equal((await tx.select().from(topics)).length, 0)
          assert.equal((await tx.select().from(articles)).length, 0)
        })
        await assert.rejects(
          db.transaction(async (tx) => {
            await tx.execute(sql`set local role mina_test_reader`)
            await tx.insert(topics).values({
              slug: 'forbidden-write',
              title: 'No',
              eventDate: '2025-01-01',
              description: '',
              summary: '',
            })
          }),
        )
      })
    },
  )
})
