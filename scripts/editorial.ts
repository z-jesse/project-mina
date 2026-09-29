import { and, asc, eq, inArray, isNotNull, notExists, sql } from 'drizzle-orm'
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
    imageArticleUrl: z
      .string()
      .transform((value) => articleUrl(value))
      .optional(),
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
            url: z.string().transform((value) => articleUrl(value)),
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

export async function inbox(
  db: NodePgDatabase<typeof schema>,
  outletSlug?: string,
) {
  return db
    .select({
      id: schema.articles.id,
      title: schema.articles.title,
      url: schema.articles.url,
      author: schema.articles.author,
      publishedAt: schema.articles.publishedAt,
      description: schema.articles.description,
      outlet: schema.outlets.name,
    })
    .from(schema.articles)
    .innerJoin(schema.outlets, eq(schema.articles.outletId, schema.outlets.id))
    .where(
      and(
        isNotNull(schema.articles.importedAt),
        outletSlug ? eq(schema.outlets.slug, outletSlug) : undefined,
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
    // Persist the first available image by import order, independently of
    // publication time or display order. Later coverage does not replace it.
    let image = existing?.image ?? null
    if (data.imageArticleUrl || !image) {
      const source = data.imageArticleUrl
        ? selected.find((article) => article.url === data.imageArticleUrl)
        : [...selected]
            .sort(
              (a, b) =>
                (a.importedAt?.getTime() ?? 0) -
                  (b.importedAt?.getTime() ?? 0) || a.id - b.id,
            )
            .find((article) => article.imageUrl)
      if (data.imageArticleUrl && !source?.imageUrl)
        throw new EditorialError('Choose an attached article with an image.')
      if (source?.imageUrl) {
        const [outlet] = await tx
          .select()
          .from(schema.outlets)
          .where(eq(schema.outlets.id, source.outletId))
        image = {
          src: source.imageUrl,
          alt: '',
          sourceName: outlet.name,
          sourceUrl: source.url,
        }
      }
    }
    const values = {
      title: data.title,
      eventDate: data.eventDate,
      description: data.description,
      summary: data.summary,
      summaryIsAi: data.summaryIsAi,
      image,
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

const coverageInput = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('attach'),
      slug,
      url: z.string().transform((value) => articleUrl(value)),
      kind: z.enum(schema.articleKind.enumValues),
    })
    .strict(),
  z
    .object({
      action: z.literal('detach'),
      slug,
      url: z.string().transform((value) => articleUrl(value)),
    })
    .strict(),
])

export async function updateCoverage(
  db: NodePgDatabase<typeof schema>,
  input: unknown,
) {
  const data = coverageInput.parse(input)
  return db.transaction(async (tx) => {
    // All editorial writes lock the topic, including concurrent coverage edits.
    const [topic] = await tx
      .select()
      .from(schema.topics)
      .where(eq(schema.topics.slug, data.slug))
      .for('update')
    if (!topic || topic.isSample)
      throw new EditorialError('Non-sample topic not found.')
    const [article] = await tx
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.url, data.url))
      .for('update')
    if (!article?.importedAt)
      throw new EditorialError('Import the article before changing coverage.')
    const members = await tx
      .select()
      .from(schema.topicArticles)
      .where(eq(schema.topicArticles.topicId, topic.id))
      .orderBy(asc(schema.topicArticles.position))
    const attached = members.some((member) => member.articleId === article.id)
    const result = { slug: topic.slug, status: topic.status, changed: false }

    if (data.action === 'detach') {
      if (!attached) return result
      if (members.length === 1)
        throw new EditorialError(
          'Keep at least one article attached to the topic.',
        )
      await tx
        .delete(schema.topicArticles)
        .where(
          and(
            eq(schema.topicArticles.topicId, topic.id),
            eq(schema.topicArticles.articleId, article.id),
          ),
        )
      // Keep the saved image and its attribution; replacement is an explicit edit.
      return {
        ...result,
        changed: true,
        imageSourceDetached: topic.image?.sourceUrl === article.url,
      }
    }

    if (attached) return result
    if (members.length >= 20)
      throw new EditorialError(
        'This review workflow supports up to 20 articles per topic.',
      )
    if (article.kind && article.kind !== data.kind)
      throw new EditorialError(
        'Article already has a different reviewed content kind.',
      )
    await tx
      .update(schema.articles)
      .set({ kind: data.kind })
      .where(eq(schema.articles.id, article.id))
    await tx.insert(schema.topicArticles).values({
      topicId: topic.id,
      articleId: article.id,
      position: (members.at(-1)?.position ?? -1) + 1,
    })
    if (!topic.image && article.imageUrl) {
      const [outlet] = await tx
        .select()
        .from(schema.outlets)
        .where(eq(schema.outlets.id, article.outletId))
      await tx
        .update(schema.topics)
        .set({
          image: {
            src: article.imageUrl,
            alt: '',
            sourceName: outlet.name,
            sourceUrl: article.url,
          },
        })
        .where(eq(schema.topics.id, topic.id))
    }
    return { ...result, changed: true }
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
