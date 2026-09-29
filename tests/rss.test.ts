import assert from 'node:assert/strict'
import { test } from 'node:test'
import { articleUrl, parseNewsFeed, pcgamer, vgc } from '../scripts/rss'

import { pcGamerFeed, testFeed, vgcFeed } from './fixtures/rss'

test('RSS preserves metadata and UTC timestamp, strips markup, and only keeps the description', async () => {
  const { items, skipped } = await parseNewsFeed(testFeed)
  assert.equal(skipped, 0)
  assert.equal(items.length, 1)
  assert.deepEqual(items[0], {
    url: 'https://www.eurogamer.net/mina-test-announcement',
    title: 'Test game gets a release date',
    author: 'Test Reporter',
    publishedAt: new Date('2026-09-25T08:30:00Z'),
    publishedDate: '2026-09-25',
    description: 'A short publisher description & details.',
    imageUrl: 'https://images.example.com/test.jpg',
    feedGuid: 'mina-test-guid',
  })
})

test('unsafe links and invalid dates are skipped without guessing publication time', async () => {
  for (const xml of [
    testFeed.replace(
      'https://www.eurogamer.net/mina-test-announcement?utm_source=rss#comments',
      'javascript:alert(1)',
    ),
    testFeed.replace('Fri, 25 Sep 2026 10:30:00 +0200', 'not-a-date'),
  ]) {
    const result = await parseNewsFeed(xml)
    assert.equal(result.items.length, 0)
    assert.equal(result.skipped, 1)
  }
})

test('optional metadata can be missing and oversized descriptions stay short', async () => {
  const xml = testFeed
    .replace(/<dc:creator>.*?<\/dc:creator>/, '')
    .replace(/<media:content[^>]+\/>/, '')
    .replace(
      /<description><!\[CDATA\[[\s\S]*?\]\]><\/description>/,
      `<description>${'word '.repeat(100)}</description>`,
    )
  const { items } = await parseNewsFeed(xml)
  assert.equal(items[0].author, undefined)
  assert.equal(items[0].imageUrl, undefined)
  assert.ok(items[0].description.length <= 320)
  assert.ok(items[0].description.endsWith('…'))
})

test('rejects malformed, oversized, and entity-declaring XML', async () => {
  for (const xml of [
    '<rss>',
    'x'.repeat(1_000_001),
    '<!DOCTYPE rss><rss/>',
    '<!ENTITY x "test"><rss/>',
  ]) {
    await assert.rejects(parseNewsFeed(xml))
  }
})

test('URL normalization removes tracking but retains meaningful parameters', () => {
  assert.equal(
    articleUrl('https://eurogamer.net/story?b=2&utm_medium=rss&a=1#x'),
    'https://www.eurogamer.net/story?a=1&b=2',
  )
  for (const url of [
    'https://www.eurogamer.net.evil.example/story',
    'http://www.eurogamer.net/story',
    'https://user:password@www.eurogamer.net/story',
  ])
    assert.throws(() => articleUrl(url))
})

test('PC Gamer keeps source attribution, image MIME metadata, and a short excerpt', async () => {
  const feed = await parseNewsFeed(pcGamerFeed, pcgamer)
  assert.equal(feed.source.slug, 'pc-gamer')
  assert.equal(feed.skipped, 0)
  assert.equal(
    feed.items[0].url,
    'https://www.pcgamer.com/mina-test-announcement',
  )
  assert.equal(feed.items[0].imageUrl, 'https://images.example.com/test.jpg')
  assert.equal(
    feed.items[0].description,
    'A short publisher description & details.',
  )
  assert.equal(
    feed.items[0].publishedAt.toISOString(),
    '2026-09-25T08:30:00.000Z',
  )

  const enclosure = pcGamerFeed.replace(
    /<media:content[^>]+\/>/,
    '<enclosure type="image/png" url="https://images.example.com/enclosure.png" length="0"/>',
  )
  assert.equal(
    (await parseNewsFeed(enclosure, pcgamer)).items[0].imageUrl,
    'https://images.example.com/enclosure.png',
  )
  assert.equal(
    articleUrl('https://pcgamer.com/story?utm_source=rss#comments'),
    'https://www.pcgamer.com/story',
  )
})

test('each feed rejects other outlets and lookalike domains', async () => {
  assert.equal((await parseNewsFeed(pcGamerFeed)).skipped, 1)
  assert.equal((await parseNewsFeed(testFeed, pcgamer)).skipped, 1)
  assert.equal(
    (
      await parseNewsFeed(
        pcGamerFeed.replaceAll(
          'www.pcgamer.com',
          'www.pcgamer.com.evil.example',
        ),
        pcgamer,
      )
    ).skipped,
    1,
  )
  assert.throws(() => articleUrl('https://unconfigured.example/story'))
})

test('PC Gamer accepts its larger feed but still bounds response size', async () => {
  const largerFeed = pcGamerFeed.replace(
    'Full article body must never be stored.',
    'x'.repeat(1_100_000),
  )
  const feed = await parseNewsFeed(largerFeed, pcgamer)
  assert.equal(feed.items.length, 1)
  assert.ok(JSON.stringify(feed).length < 2000)
  await assert.rejects(parseNewsFeed(largerFeed))
  await assert.rejects(parseNewsFeed('x'.repeat(2_000_001), pcgamer))
})

test('VGC reads the description image while retaining only plain-text metadata', async () => {
  const feed = await parseNewsFeed(vgcFeed, vgc)
  assert.equal(feed.source.slug, 'vgc')
  assert.equal(feed.skipped, 0)
  assert.equal(
    feed.items[0].url,
    'https://www.videogameschronicle.com/mina-test-announcement',
  )
  assert.equal(
    feed.items[0].imageUrl,
    'https://images.example.com/vgc.jpg?width=800&quality=80',
  )
  assert.equal(
    feed.items[0].description,
    'A short publisher description & details.',
  )
  assert.equal(feed.items[0].author, 'Test Reporter')
  assert.equal(
    feed.items[0].publishedAt.toISOString(),
    '2026-09-25T08:30:00.000Z',
  )
  assert.ok(!JSON.stringify(feed).includes('Full article body'))
  assert.equal(
    articleUrl('https://videogameschronicle.com/news/story/?utm_source=rss'),
    'https://www.videogameschronicle.com/news/story/',
  )
  assert.equal((await parseNewsFeed(vgcFeed)).skipped, 1)
  assert.equal((await parseNewsFeed(testFeed, vgc)).skipped, 1)
  assert.equal(
    (
      await parseNewsFeed(
        vgcFeed.replaceAll(
          'www.videogameschronicle.com',
          'www.videogameschronicle.com.evil.example',
        ),
        vgc,
      )
    ).skipped,
    1,
  )
})

test('VGC rejects unsafe description images and tolerates missing thumbnails', async () => {
  for (const replacement of [
    '',
    '<img src="javascript:alert(1)">',
    '<img src="http://images.example.com/test.jpg">',
    '<img src="https://user:password@images.example.com/test.jpg">',
    '<img data-src="https://images.example.com/test.jpg">',
  ]) {
    const feed = await parseNewsFeed(
      vgcFeed.replace(/<img[^>]*>/, replacement),
      vgc,
    )
    assert.equal(feed.items.length, 1)
    assert.equal(feed.items[0].imageUrl, undefined)
  }
  const singleQuoted = vgcFeed.replace(
    /<img[^>]*>/,
    "<img src='https://images.example.com/single.jpg'>",
  )
  assert.equal(
    (await parseNewsFeed(singleQuoted, vgc)).items[0].imageUrl,
    'https://images.example.com/single.jpg',
  )
})
