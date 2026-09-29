import { Bookmark } from 'lucide-react'
import { toggleSavedStory, useSavedStories } from '../lib/saved-stories'

export default function SaveStoryButton({
  slug,
  title,
}: {
  slug: string
  title: string
}) {
  const saved = useSavedStories()
  const selected = saved.includes(slug)
  const full = !selected && saved.length >= 100
  return (
    <button
      type="button"
      className="save-story"
      aria-label={`${selected ? 'Remove saved story' : 'Save story'}: ${title}`}
      aria-pressed={selected}
      disabled={full}
      title={
        full
          ? 'Saved stories is full (100 stories).'
          : selected
            ? 'Remove from Saved'
            : 'Save in this browser'
      }
      onClick={() => toggleSavedStory(slug)}
    >
      <Bookmark
        size={16}
        aria-hidden="true"
        fill={selected ? 'currentColor' : 'none'}
      />
      <span>{selected ? 'Saved' : 'Save'}</span>
    </button>
  )
}
