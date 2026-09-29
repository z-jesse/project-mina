import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { z } from 'zod'
import { sampleGtaGame, sampleTopics } from '../data/sample-topics'
import { withDatabase } from '../db/client.server'
import * as schema from '../db/schema'
import type { Topic } from '../lib/content'

const { topics, articles, outlets, subjects, topicArticles, topicSubjects } =
  schema
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))

function usesDatabase() {
  return (
    z
      .enum(['sample', 'database'])
      .default('sample')
      .parse(process.env.CONTENT_SOURCE) === 'database'
  )
}

async function selectTopics(
  db: NodePgDatabase<typeof schema>,
  filter: { slug?: string; slugs?: string[]; subjectId?: number } = {},
): Promise<Topic[]> {
  const conditions = [eq(topics.status, 'published')]
  if (filter.slug) conditions.push(eq(topics.slug, filter.slug))
  if (filter.slugs) conditions.push(inArray(topics.slug, filter.slugs))
  if (filter.subjectId !== undefined) {
    conditions.push(
      inArray(
        topics.id,
        db
          .select({ id: topicSubjects.topicId })
          .from(topicSubjects)
          .where(eq(topicSubjects.subjectId, filter.subjectId)),
      ),
    )
  }
  const rows = await db
    .select()
    .from(topics)
    .where(and(...conditions))
    .orderBy(desc(topics.eventDate), desc(topics.id))
    .limit(filter.slug ? 1 : filter.slugs ? 100 : 50)
  if (!rows.length) return []

  const ids = rows.map((row) => row.id)
  // Batch relationships for the page; no query per topic/article.
  const articleRows = await db
    .select({
      topicId: topicArticles.topicId,
      article: articles,
      outlet: outlets.name,
    })
    .from(topicArticles)
    .innerJoin(articles, eq(articles.id, topicArticles.articleId))
    .innerJoin(outlets, eq(outlets.id, articles.outletId))
    .where(inArray(topicArticles.topicId, ids))
    .orderBy(asc(topicArticles.position))
  const subjectRows = await db
    .select({ topicId: topicSubjects.topicId, name: subjects.name })
    .from(topicSubjects)
    .innerJoin(subjects, eq(subjects.id, topicSubjects.subjectId))
    .where(inArray(topicSubjects.topicId, ids))
    .orderBy(asc(topicSubjects.position))

  return rows.map((row) => ({
    isSample: row.isSample,
    summaryIsAi: row.isSample || row.summaryIsAi,
    slug: row.slug,
    title: row.title,
    date: row.eventDate,
    dateLabel: dateLabel(row.eventDate),
    description: row.description,
    summary: row.summary,
    announcement: row.announcement ?? undefined,
    image: row.image ?? undefined,
    subjects: subjectRows
      .filter((subject) => subject.topicId === row.id)
      .map((subject) => subject.name),
    articles: articleRows
      .filter((article) => article.topicId === row.id)
      .map(({ article, outlet }) => ({
        outlet,
        author: article.author ?? '',
        date: article.publishedAt?.toISOString() ?? article.publishedDate,
        dateLabel: article.publishedAt
          ? `${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(article.publishedAt)} UTC`
          : dateLabel(article.publishedDate),
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.imageUrl ?? undefined,
        descriptionSource: article.feedUrl ? 'publisher' : undefined,
      })),
  }))
}

export async function listTopics() {
  if (!usesDatabase()) return sampleTopics
  return withDatabase((db) => selectTopics(db))
}

export async function findTopic(slug: string) {
  if (!usesDatabase()) return sampleTopics.find((topic) => topic.slug === slug)
  return withDatabase(async (db) => (await selectTopics(db, { slug }))[0])
}

export async function findSavedTopics(slugs: string[]) {
  if (!slugs.length) return []
  if (!usesDatabase())
    return sampleTopics.filter((topic) => slugs.includes(topic.slug))
  return withDatabase((db) => selectTopics(db, { slugs }))
}

export async function getGtaGame() {
  if (!usesDatabase())
    return {
      ...sampleGtaGame,
      topics: sampleTopics.filter((topic) =>
        topic.subjects.includes(sampleGtaGame.name),
      ),
    }
  return withDatabase(async (db) => {
    const [game] = await db
      .select()
      .from(subjects)
      .where(
        and(
          eq(subjects.slug, 'grand-theft-auto-vi'),
          eq(subjects.kind, 'game'),
        ),
      )
      .limit(1)
    if (!game) return undefined
    return {
      name: game.name,
      description: game.description,
      topics: await selectTopics(db, { subjectId: game.id }),
    }
  })
}
