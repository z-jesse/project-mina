import { and, eq, inArray, isNotNull, notExists, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { z } from 'zod'
import * as schema from '../src/db/schema'
import { articleUrl } from './rss'

export class EditorialError extends Error {}

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(160)
export const draftInput = z
  .object({
    slug,
    title: z.string().trim().min(1).max(300),
    eventDate: z.iso.date(),
    description: z.string().trim().min(1).max(320),
    summary: z.string().trim().min(1).max(2000),
    summaryIsAi: z.boolean(),
    subjects: z
      .array(
        z
          .object({
            slug,
            name: z.string().trim().min(1).max(150),
            kind: z.enum(schema.subjectKind.enumValues),
          })
          .strict(),
      )
      .min(1)
      .max(10),
    articles: z
      .array(
        z
          .object({
            url: z.string().transform(articleUrl),
            kind: z.enum(schema.articleKind.enumValues),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      new Set(data.articles.map((a) => a.url)).size !== data.articles.length ||
      new Set(data.subjects.map((s) => s.slug)).size !== data.subjects.length
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate article URLs or subject slugs.',
      })
    }
  })

export async function inbox(db: NodePgDatabase<typeof schema>) {
  return db
    .select({
      id: schema.articles.id,
      title: schema.articles.title,
      url: schema.articles.url,
      author: schema.articles.author,
      publishedAt: schema.articles.publishedAt,
      description: schema.articles.description,
    })
    .from(schema.articles)
    .where(
      and(
        isNotNull(schema.articles.importedAt),
        notExists(
          db
            .select({ id: schema.topicArticles.topicId })
            .from(schema.topicArticles)
            .where(eq(schema.topicArticles.articleId, schema.articles.id)),
        ),
      ),
    )
    .orderBy(
      sql`${schema.articles.publishedAt} desc`,
      sql`${schema.articles.id} desc`,
    )
    .limit(100)
}

export async function saveDraft(
  db: NodePgDatabase<typeof schema>,
  input: unknown,
) {
  const data = draftInput.parse(input)
  return db.transaction(async (tx) => {
    // Lock an existing draft so saving and publishing cannot race.
    const [existing] = await tx
      .select()
      .from(schema.topics)
      .where(eq(schema.topics.slug, data.slug))
      .for('update')
    if (existing && (existing.isSample || existing.status !== 'draft'))
      throw new EditorialError(
        'Only non-sample drafts can be edited. Unpublish first.',
      )
    const selected = await tx
      .select()
      .from(schema.articles)
      .where(
        inArray(
          schema.articles.url,
          data.articles.map((a) => a.url),
        ),
      )
    if (
      selected.length !== data.articles.length ||
      selected.some((a) => !a.importedAt)
    )
      throw new EditorialError(
        'Import every selected article before creating the draft.',
      )
    const values = {
      title: data.title,
      eventDate: data.eventDate,
      description: data.description,
      summary: data.summary,
      summaryIsAi: data.summaryIsAi,
    }
    const topic =
      existing ??
      (
        await tx
          .insert(schema.topics)
          .values({ ...values, slug: data.slug })
          .returning()
      )[0]
    if (existing)
      await tx
        .update(schema.topics)
        .set(values)
        .where(eq(schema.topics.id, topic.id))
    await tx
      .delete(schema.topicArticles)
      .where(eq(schema.topicArticles.topicId, topic.id))
    await tx
      .delete(schema.topicSubjects)
      .where(eq(schema.topicSubjects.topicId, topic.id))
    for (const [position, article] of data.articles.entries()) {
      const saved = selected.find((a) => a.url === article.url)
      if (!saved) throw new EditorialError('Selected article not found.')
      await tx
        .update(schema.articles)
        .set({ kind: article.kind })
        .where(eq(schema.articles.id, saved.id))
      await tx
        .insert(schema.topicArticles)
        .values({ topicId: topic.id, articleId: saved.id, position })
    }
    for (const [position, subject] of data.subjects.entries()) {
      await tx.insert(schema.subjects).values(subject).onConflictDoNothing()
      const [saved] = await tx
        .select()
        .from(schema.subjects)
        .where(eq(schema.subjects.slug, subject.slug))
      if (saved.kind !== subject.kind || saved.name !== subject.name)
        throw new EditorialError('Subject slug already has different metadata.')
      await tx
        .insert(schema.topicSubjects)
        .values({ topicId: topic.id, subjectId: saved.id, position })
    }
    return { slug: data.slug, status: 'draft' }
  })
}

export async function setPublication(
  db: NodePgDatabase<typeof schema>,
  topicSlug: string,
  publish: boolean,
) {
  slug.parse(topicSlug)
  return db.transaction(async (tx) => {
    const [topic] = await tx
      .select()
      .from(schema.topics)
      .where(eq(schema.topics.slug, topicSlug))
      .for('update')
    if (!topic || topic.isSample)
      throw new EditorialError('Non-sample topic not found.')
    const articles = await tx
      .select()
      .from(schema.topicArticles)
      .where(eq(schema.topicArticles.topicId, topic.id))
    const subjects = await tx
      .select()
      .from(schema.topicSubjects)
      .where(eq(schema.topicSubjects.topicId, topic.id))
    if (
      publish &&
      (!articles.length ||
        !subjects.length ||
        !topic.title.trim() ||
        !topic.summary.trim())
    )
      throw new EditorialError('Topic is incomplete.')
    const status = publish ? 'published' : 'draft'
    await tx
      .update(schema.topics)
      .set({ status })
      .where(eq(schema.topics.id, topic.id))
    return { slug: topicSlug, status }
  })
}
