import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import type { Topic } from '../lib/content'

export const subjectKind = pgEnum('subject_kind', [
  'game',
  'company',
  'platform',
  'storefront',
  'subject',
])
export const topicStatus = pgEnum('topic_status', ['draft', 'published'])
export const articleKind = pgEnum('article_kind', [
  'reporting',
  'analysis',
  'opinion',
  'rumor',
  'review',
  'guide',
])

// RLS has no public policies: access is through server functions, not the Data API.
export const outlets = pgTable('outlets', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  siteUrl: text('site_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS()

export const subjects = pgTable('subjects', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  kind: subjectKind().notNull(),
  description: text(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS()

export const articles = pgTable(
  'articles',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    outletId: integer('outlet_id')
      .notNull()
      .references(() => outlets.id),
    url: text().notNull().unique(),
    title: text().notNull(),
    author: text(),
    // Samples have day precision; do not manufacture publication times.
    publishedDate: date('published_date').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    feedUrl: text('feed_url'),
    feedGuid: text('feed_guid'),
    importedAt: timestamp('imported_at', { withTimezone: true }),
    description: text().notNull(),
    kind: articleKind(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('articles_outlet_idx').on(table.outletId),
    uniqueIndex('articles_outlet_feed_guid_unique').on(
      table.outletId,
      table.feedGuid,
    ),
  ],
).enableRLS()

export const topics = pgTable(
  'topics',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    eventDate: date('event_date').notNull(),
    description: text().notNull(),
    summary: text().notNull(),
    status: topicStatus().notNull().default('draft'),
    isSample: boolean('is_sample').notNull().default(false),
    summaryIsAi: boolean('summary_is_ai').notNull().default(false),
    announcement: jsonb().$type<Topic['announcement']>(),
    image: jsonb().$type<Topic['image']>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('topics_feed_idx').on(
      table.status,
      table.isSample,
      table.eventDate.desc(),
      table.id.desc(),
    ),
  ],
).enableRLS()

export const topicArticles = pgTable(
  'topic_articles',
  {
    topicId: integer('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.topicId, table.articleId] }),
    unique('topic_articles_position_unique').on(table.topicId, table.position),
    index('topic_articles_article_idx').on(table.articleId),
    check('topic_articles_position_nonnegative', sql`${table.position} >= 0`),
  ],
).enableRLS()

export const topicSubjects = pgTable(
  'topic_subjects',
  {
    topicId: integer('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.topicId, table.subjectId] }),
    unique('topic_subjects_position_unique').on(table.topicId, table.position),
    index('topic_subjects_subject_idx').on(table.subjectId, table.topicId),
    check('topic_subjects_position_nonnegative', sql`${table.position} >= 0`),
  ],
).enableRLS()

// Auth is a separate service locally. Only the server's verified Auth user ID
// enters this table; there is deliberately no cross-database auth.users FK.
export const articleVotes = pgTable(
  'article_votes',
  {
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    value: integer().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.userId] }),
    index('article_votes_user_idx').on(table.userId),
    check('article_votes_value_check', sql`${table.value} in (-1, 1)`),
  ],
).enableRLS()
