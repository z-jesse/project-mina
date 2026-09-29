import { useSyncExternalStore } from 'react'

const key = 'mina:saved-stories'
const changed = 'mina:saved-stories-changed'
const empty: string[] = []
let saved: string[] | undefined

export function getSavedStories() {
  if (saved) return saved
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    saved = Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (slug): slug is string =>
                typeof slug === 'string' &&
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
                slug.length <= 160,
            ),
          ),
        ].slice(0, 100)
      : []
  } catch {
    saved = []
  }
  return saved
}

export function toggleSavedStory(slug: string) {
  const current = getSavedStories()
  if (!current.includes(slug) && current.length >= 100) return
  saved = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [slug, ...current]
  try {
    window.localStorage.setItem(key, JSON.stringify(saved))
  } catch {
    // Keep saves for this page session if browser storage is unavailable.
  }
  window.dispatchEvent(new Event(changed))
}

export function subscribeSavedStories(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return
    saved = undefined
    listener()
  }
  window.addEventListener(changed, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(changed, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSavedStories() {
  return useSyncExternalStore(
    subscribeSavedStories,
    getSavedStories,
    () => empty,
  )
}
