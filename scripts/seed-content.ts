import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { sampleGtaGame, sampleTopics } from '../src/data/sample-topics'
import * as schema from '../src/db/schema'

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const kinds: Record<string, (typeof schema.subjectKind.enumValues)[number]> = {
  Steam: 'storefront',
  'PC gaming': 'platform',
  Handhelds: 'subject',
  'Grand Theft Auto VI': 'game',
  'Rockstar Games': 'company',
  'Release delays': 'subject',
  Trailers: 'subject',
  'Electronic Arts': 'company',
  Respawn: 'company',
  Layoffs: 'subject',
  'Oblivion Remastered': 'game',
  Bethesda: 'company',
  'Game releases': 'subject',
  'Nintendo Switch 2': 'platform',
  Nintendo: 'company',
  Hardware: 'subject',
}

// Insert missing fixtures only. Re-running preserves existing content and edits.
export async function seedContent(db: NodePgDatabase<typeof schema>) {
  return db.transaction(async (tx) => {
    let inserted = 0
    for (const topic of sampleTopics) {
      const [existing] = await tx
        .select()
        .from(schema.topics)
        .where(eq(schema.topics.slug, topic.slug))
      if (existing && !existing.isSample)
        throw new Error(
          `Seed slug belongs to non-sample content: ${topic.slug}`,
        )
      if (existing) continue
      const [savedTopic] = await tx
        .insert(schema.topics)
        .values({
          slug: topic.slug,
          title: topic.title,
          eventDate: topic.date,
          description: topic.description,
          summary: topic.summary,
          status: 'published',
          isSample: true,
          announcement: topic.announcement,
          image: topic.image,
        })
        .onConflictDoNothing()
        .returning()
      if (!savedTopic)
        throw new Error('Content changed during seeding; retry the seed.')

      for (const [position, name] of topic.subjects.entries()) {
        const slug = slugify(name)
        const kind = kinds[name]
        if (!kind) throw new Error(`Missing sample subject kind: ${name}`)
        await tx
          .insert(schema.subjects)
          .values({
            slug,
            name,
            kind,
            description:
              name === sampleGtaGame.name ? sampleGtaGame.description : null,
          })
          .onConflictDoNothing()
        const [subject] = await tx
          .select()
          .from(schema.subjects)
          .where(eq(schema.subjects.slug, slug))
        await tx
          .insert(schema.topicSubjects)
          .values({ topicId: savedTopic.id, subjectId: subject.id, position })
      }

      for (const [position, article] of topic.articles.entries()) {
        const slug = slugify(article.outlet)
        await tx
          .insert(schema.outlets)
          .values({
            slug,
            name: article.outlet,
            siteUrl: new URL(article.url).origin,
          })
          .onConflictDoNothing()
        const [outlet] = await tx
          .select()
          .from(schema.outlets)
          .where(eq(schema.outlets.slug, slug))
        await tx
          .insert(schema.articles)
          .values({
            outletId: outlet.id,
            url: article.url,
            title: article.title,
            author: article.author,
            publishedDate: article.date,
            description: article.description,
            imageUrl: article.image,
          })
          .onConflictDoNothing()
        const [savedArticle] = await tx
          .select()
          .from(schema.articles)
          .where(eq(schema.articles.url, article.url))
        await tx
          .insert(schema.topicArticles)
          .values({
            topicId: savedTopic.id,
            articleId: savedArticle.id,
            position,
          })
      }
      inserted++
    }
    return inserted
  })
}
