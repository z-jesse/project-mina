import assert from 'node:assert/strict'
import { test } from 'node:test'
import { articleUrl, parseNewsFeed } from '../scripts/rss'

import { testFeed } from './fixtures/rss'

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
