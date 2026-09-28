import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eq, inArray, sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { seedContent } from '../scripts/seed-content'
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
    'draft/live records stay out of historical preview; membership allows shared topics',
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
          assert.equal((await listTopics()).length, sampleTopics.length)
          assert.equal(await findTopic('test-draft'), undefined)
          assert.equal(await findTopic('test-live'), undefined)
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
          await db
            .insert(topicArticles)
            .values({
              topicId: inserted[0].id,
              articleId: article.id,
              position: 0,
            })
          assert.equal((await getGtaGame())?.topics.length, 3)
          await assert.rejects(
            db
              .insert(topicArticles)
              .values({
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
            await tx
              .insert(topics)
              .values({
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
