import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import Parser from 'rss-parser'
import * as schema from '../src/db/schema'

export const eurogamer = {
  slug: 'eurogamer',
  name: 'Eurogamer',
  siteUrl: 'https://www.eurogamer.net',
  feedUrl: 'https://www.eurogamer.net/feed/news',
  maxBytes: 1_000_000,
}
export const pcgamer = {
  slug: 'pc-gamer',
  name: 'PC Gamer',
  siteUrl: 'https://www.pcgamer.com',
  feedUrl: 'https://www.pcgamer.com/rss/',
  maxBytes: 2_000_000,
}
export const newsSources = [eurogamer, pcgamer]
type NewsSource = (typeof newsSources)[number]
const parser = new Parser<
  Record<string, never>,
  { media?: { $?: { url?: string; medium?: string; type?: string } }[] }
>({
  customFields: { item: [['media:content', 'media', { keepArray: true }]] },
})

export function articleUrl(value: string, source?: NewsSource) {
  const url = new URL(value)
  const matchedSource = newsSources.find((candidate) => {
    const host = new URL(candidate.siteUrl).hostname
    return [host, host.replace(/^www\./, '')].includes(url.hostname)
  })
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !matchedSource ||
    (source && source.slug !== matchedSource.slug) ||
    url.port
  ) {
    throw new Error('Expected an HTTPS article URL from the selected outlet.')
  }
  url.hostname = new URL(matchedSource.siteUrl).hostname
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key))
      url.searchParams.delete(key)
  }
  url.searchParams.sort()
  return url.toString()
}

function imageUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

const plainText = (value: string) =>
  value
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export async function parseNewsFeed(xml: string, source = eurogamer) {
  if (
    Buffer.byteLength(xml) > source.maxBytes ||
    /<!DOCTYPE|<!ENTITY/i.test(xml)
  ) {
    throw new Error(
      'Feed exceeds the size limit or contains unsupported XML declarations.',
    )
  }
  const feed = await parser.parseString(xml)
  const items: Array<{
    url: string
    title: string
    author?: string
    publishedAt: Date
    publishedDate: string
    description: string
    imageUrl?: string
    feedGuid?: string
  }> = []
  let skipped = 0
  for (const item of feed.items.slice(0, 100)) {
    try {
      const title = plainText(item.title ?? '')
      const publishedAt = new Date(item.isoDate ?? item.pubDate ?? '')
      if (
        !title ||
        title.length > 1000 ||
        !Number.isFinite(publishedAt.getTime())
      )
        throw new Error('Invalid metadata')
      const snippet = plainText(item.contentSnippet ?? '').replace(
        /\s*Read more\s*$/i,
        '',
      )
      items.push({
        url: articleUrl(item.link ?? '', source),
        title,
        author: item.creator
          ? plainText(item.creator).slice(0, 300)
          : undefined,
        publishedAt,
        publishedDate: publishedAt.toISOString().slice(0, 10),
        description:
          snippet.length > 320
            ? `${snippet.slice(0, 319).trimEnd()}…`
            : snippet,
        imageUrl: imageUrl(
          item.media?.find(
            (media) =>
              media.$?.medium === 'image' ||
              media.$?.type?.startsWith('image/'),
          )?.$?.url ??
            (item.enclosure?.type?.startsWith('image/')
              ? item.enclosure.url
              : undefined),
        ),
        feedGuid: item.guid?.trim().slice(0, 2048) || undefined,
      })
    } catch {
      skipped++
    }
  }
  return {
    source,
    items,
    skipped: skipped + Math.max(0, feed.items.length - 100),
  }
}

export async function fetchNewsFeed(source = eurogamer) {
  const response = await fetch(source.feedUrl, {
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
    headers: {
      'User-Agent': 'GamesWatchdog-LocalPrototype/0.1',
      Accept: 'application/rss+xml, application/xml',
    },
  })
  if (!response.ok || !response.body)
    throw new Error(`Feed request failed (${response.status}).`)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > source.maxBytes)
        throw new Error('Feed exceeds the size limit.')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
  }
  return parseNewsFeed(Buffer.concat(chunks).toString('utf8'), source)
}

export async function importNews(
  db: NodePgDatabase<typeof schema>,
  feed: Awaited<ReturnType<typeof parseNewsFeed>>,
) {
  return db.transaction(async (tx) => {
    const { source } = feed
    await tx
      .insert(schema.outlets)
      .values({
        slug: source.slug,
        name: source.name,
        siteUrl: source.siteUrl,
      })
      .onConflictDoNothing()
    const [outlet] = await tx
      .select()
      .from(schema.outlets)
      .where(eq(schema.outlets.slug, source.slug))
    let inserted = 0
    for (const item of feed.items) {
      // Preserve existing metadata/editorial changes; URL and outlet/GUID dedupe
      // also work across repeated or concurrent imports. No topic is created.
      const rows = await tx
        .insert(schema.articles)
        .values({
          ...item,
          outletId: outlet.id,
          feedUrl: source.feedUrl,
          importedAt: new Date(),
          kind: null,
        })
        .onConflictDoNothing()
        .returning({ id: schema.articles.id })
      inserted += rows.length
    }
    return {
      inserted,
      duplicates: feed.items.length - inserted,
      skipped: feed.skipped,
    }
  })
}
