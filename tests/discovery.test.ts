import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sampleTopics } from '../src/data/sample-topics'
import { discoverSubjects, filterTopics } from '../src/lib/discovery'
import {
  getSavedStories,
  subscribeSavedStories,
  toggleSavedStory,
} from '../src/lib/saved-stories'

test('discovery combines aliases, outlet search, and an exact subject without duplicating stories', () => {
  const gta = sampleTopics.filter((topic) =>
    topic.subjects.includes('Grand Theft Auto VI'),
  )
  assert.deepEqual(filterTopics(sampleTopics, 'GTA6'), gta)
  assert.deepEqual(filterTopics(sampleTopics, 'gta 6'), gta)
  const matches = filterTopics(
    sampleTopics,
    'GTA6 VGC',
    'Grand Theft Auto VI',
  )
  assert.ok(matches.length > 0)
  assert.ok(
    matches.every((topic) =>
      topic.articles.some((article) => article.outlet === 'VGC'),
    ),
  )
  assert.deepEqual(filterTopics(sampleTopics, 'GTA6', 'Steam'), [])
  assert.deepEqual(filterTopics(sampleTopics, 'not-a-real-game-123'), [])
  assert.ok(
    discoverSubjects(sampleTopics).every((subject) =>
      sampleTopics.some((topic) => topic.subjects.includes(subject)),
    ),
  )
})

test('bookmarks survive reload, sync storage events, and stay usable when storage is blocked', () => {
  const storage = new Map([
    ['mina:saved-stories', '["existing-story",17,"bad/slug","existing-story"]'],
  ])
  let blocked = false
  const browser = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (blocked) throw new Error('Storage unavailable')
        storage.set(key, value)
      },
    },
  })
  Object.defineProperty(globalThis, 'window', {
    value: browser,
    configurable: true,
  })
  let notifications = 0
  const unsubscribe = subscribeSavedStories(() => notifications++)
  const reload = () => {
    const event = new Event('storage')
    Object.defineProperty(event, 'key', { value: 'mina:saved-stories' })
    browser.dispatchEvent(event)
  }
  try {
    assert.deepEqual(getSavedStories(), ['existing-story'])
    toggleSavedStory('new-story')
    reload()
    assert.deepEqual(getSavedStories(), ['new-story', 'existing-story'])
    toggleSavedStory('new-story')
    assert.deepEqual(getSavedStories(), ['existing-story'])
    storage.set('mina:saved-stories', '["other-tab-story"]')
    reload()
    assert.deepEqual(getSavedStories(), ['other-tab-story'])
    storage.set('mina:saved-stories', 'invalid json')
    reload()
    assert.deepEqual(getSavedStories(), [])
    blocked = true
    toggleSavedStory('session-story')
    assert.deepEqual(getSavedStories(), ['session-story'])
    toggleSavedStory('session-story')
    assert.deepEqual(getSavedStories(), [])
    assert.ok(notifications >= 7)
  } finally {
    unsubscribe()
    Reflect.deleteProperty(globalThis, 'window')
  }
})
