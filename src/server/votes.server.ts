import { and, eq, inArray, sql } from 'drizzle-orm'
import { withDatabase } from '../db/client.server'
import {
  articles,
  articleVotes,
  topicArticles,
  topics,
} from '../db/content-schema'

export async function readArticleVotes(urls: string[], userId: string | null) {
  if (!urls.length) return []
  return withDatabase(async (db) => {
    const visible = db
      .selectDistinct({ id: topicArticles.articleId })
      .from(topicArticles)
      .innerJoin(topics, eq(topics.id, topicArticles.topicId))
      .where(eq(topics.status, 'published'))
    return db
      .select({
        url: articles.url,
        helpful:
          sql<number>`count(*) filter (where ${articleVotes.value} = 1)`.mapWith(
            Number,
          ),
        unhelpful:
          sql<number>`count(*) filter (where ${articleVotes.value} = -1)`.mapWith(
            Number,
          ),
        ownVote: sql<
          number | null
        >`max(case when ${articleVotes.userId} = ${userId}::uuid then ${articleVotes.value} end)`,
      })
      .from(articles)
      .leftJoin(articleVotes, eq(articleVotes.articleId, articles.id))
      .where(and(inArray(articles.url, urls), inArray(articles.id, visible)))
      .groupBy(articles.id, articles.url)
  })
}

// An absolute choice (including null), never a server-side toggle: retrying a
// request cannot accidentally invert it. userId comes only from requireUser().
export async function writeArticleVote(
  url: string,
  userId: string,
  value: 1 | -1 | null,
) {
  return withDatabase(async (db) =>
    db.transaction(async (tx) => {
      const [article] = await tx
        .select({ id: articles.id })
        .from(articles)
        .innerJoin(topicArticles, eq(topicArticles.articleId, articles.id))
        .innerJoin(topics, eq(topics.id, topicArticles.topicId))
        .where(and(eq(articles.url, url), eq(topics.status, 'published')))
        .limit(1)
      if (!article)
        return { error: 'This article is no longer available for voting.' }
      if (value === null) {
        await tx
          .delete(articleVotes)
          .where(
            and(
              eq(articleVotes.articleId, article.id),
              eq(articleVotes.userId, userId),
            ),
          )
      } else {
        await tx
          .insert(articleVotes)
          .values({ articleId: article.id, userId, value })
          .onConflictDoUpdate({
            target: [articleVotes.articleId, articleVotes.userId],
            set: { value, updatedAt: new Date() },
          })
      }
      return { error: null }
    }),
  )
}
