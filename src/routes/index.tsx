import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Bookmark, Search, Sparkles, X } from 'lucide-react'
import { z } from 'zod'
import TopicList from '../components/TopicList'
import SaveStoryButton from '../components/SaveStoryButton'
import { discoverSubjects, filterTopics, subjectLabel } from '../lib/discovery'
import { useSavedStories } from '../lib/saved-stories'
import { getNews, getSavedTopics } from '../server/topics.functions'

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    q: z.string().trim().max(120).optional().catch(undefined),
    subject: z.string().trim().max(150).optional().catch(undefined),
    view: z.enum(['saved', 'for-you']).optional().catch(undefined),
  }),
  loader: () => getNews(),
  head: ({ match }) => ({
    meta: [
      {
        title: `${match.search.view === 'saved' ? 'Saved stories' : match.search.view === 'for-you' ? 'For You' : 'Gaming news'} | Games Watchdog`,
      },
      {
        name: 'description',
        content: 'Gaming news with coverage grouped around specific events.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  pendingComponent: () => (
    <main id="main-content" className="topic-page">
      <output className="topic-wrap feed-wrap discovery-empty">
        Loading stories…
      </output>
    </main>
  ),
  errorComponent: NewsError,
  component: NewsPage,
})

function NewsError({ reset }: { reset: () => void }) {
  const router = useRouter()
  return (
    <main id="main-content" className="topic-page">
      <div className="topic-wrap feed-wrap discovery-empty">
        <h1>Stories couldn’t load</h1>
        <p>Please try again in a moment.</p>
        <button
          type="button"
          onClick={async () => {
            await router.invalidate()
            reset()
          }}
        >
          Try again
        </button>
      </div>
    </main>
  )
}

function NewsPage() {
  const topics = Route.useLoaderData()
  const { q, subject, view } = Route.useSearch()
  const saved = useSavedStories()
  const savedQuery = useQuery({
    queryKey: ['saved-topics', saved],
    queryFn: () => getSavedTopics({ data: { slugs: saved } }),
    enabled: view === 'saved' && saved.length > 0,
  })
  const savedTopics = saved.flatMap(
    (slug) => savedQuery.data?.filter((topic) => topic.slug === slug) ?? [],
  )
  const visible = filterTopics(
    view === 'saved' ? savedTopics : topics,
    q,
    subject,
  )
  const subjects = discoverSubjects(topics)
  const unavailable = view === 'saved' && savedQuery.isSuccess
    ? saved.filter(
        (slug) => !savedQuery.data.some((topic) => topic.slug === slug),
      )
    : []
  const title =
    view === 'saved'
      ? 'Saved stories'
      : q
        ? `Results for “${q}”`
        : subject
          ? subjectLabel(subject)
          : 'Latest stories'

  return (
    <main id="main-content" className="topic-page feed-page">
      <div className="topic-wrap feed-wrap">
        {!view && (
          <nav
            className="discovery-subjects"
            aria-label="Explore gaming subjects"
          >
            <span className="discovery-label">Explore</span>
            <Link
              to="/"
              search={{ q, subject: undefined }}
              activeOptions={{ exact: true, explicitUndefined: true }}
              aria-current={!subject ? 'page' : undefined}
              resetScroll={false}
            >
              All stories
            </Link>
            {[...new Set([...subjects, ...(subject ? [subject] : [])])].map(
              (name) => (
                <Link
                  key={name}
                  to="/"
                  search={{ q, subject: name }}
                  aria-current={subject === name ? 'page' : undefined}
                  resetScroll={false}
                >
                  {subjectLabel(name)}
                </Link>
              ),
            )}
          </nav>
        )}
        {view === 'for-you' ? (
          <section className="discovery-empty for-you-placeholder">
            <Sparkles size={28} aria-hidden="true" />
            <p className="discovery-label">Coming later</p>
            <h1>For You</h1>
            <p>A feed shaped by the games and subjects you follow.</p>
            <Link to="/" search={{}}>
              Browse the latest stories →
            </Link>
          </section>
        ) : (
          <>
            <header className="feed-heading discovery-heading">
              <h1>{title}</h1>
              <output>
                {visible.length} {visible.length === 1 ? 'story' : 'stories'} ·{' '}
                {view === 'saved' ? 'Recently saved' : 'Newest first'}
              </output>
            </header>
            {view === 'saved' ? (
              <p className="discovery-note">
                Saved in this browser. If storage is unavailable, saves last for
                this session.
              </p>
            ) : (
              <p className="discovery-note">
                {q || subject ? 'Filtering the latest 50 published stories. ' : ''}
                {topics.length > 0 && topics.every((topic) => topic.isSample)
                  ? 'Historical sample coverage · AI-written summaries for this prototype.'
                  : 'Preview · Historical samples and AI-assisted summaries are labeled.'}
              </p>
            )}
            {(q || subject) && (
              <div className="discovery-filters">
                {subject && <span>{subjectLabel(subject)}</span>}
                {q && <span>“{q}”</span>}
                <Link to="/" search={{ view }}>
                  <X size={14} aria-hidden="true" /> Clear filters
                </Link>
              </div>
            )}
            {view === 'saved' && saved.length > 0 && savedQuery.isPending ? (
              <output className="discovery-empty">
                Loading saved stories…
              </output>
            ) : view === 'saved' && savedQuery.isError ? (
              <div className="discovery-empty">
                <p>
                  Saved stories couldn’t load. Your bookmarks are still here.
                </p>
                <button type="button" onClick={() => void savedQuery.refetch()}>
                  Try again
                </button>
              </div>
            ) : (
              <>
                <TopicList topics={visible} />
                {!visible.length && !unavailable.length && (
                  <div className="discovery-empty">
                    {view === 'saved' ? (
                      <Bookmark size={28} aria-hidden="true" />
                    ) : (
                      <Search size={28} aria-hidden="true" />
                    )}
                    <h2>
                      {q || subject
                        ? 'No matching stories'
                        : view === 'saved'
                          ? 'Keep a story for later'
                          : 'No stories yet'}
                    </h2>
                    <p>
                      {q || subject
                        ? 'Try another game, subject, or outlet, or clear your filters.'
                        : view === 'saved'
                          ? 'Use Save on any story to find it here.'
                          : 'Published stories will appear here.'}
                    </p>
                    <Link to="/" search={{}}>
                      Browse all stories →
                    </Link>
                  </div>
                )}
                {unavailable.map((slug) => (
                  <div key={slug} className="saved-unavailable">
                    <p>
                      This saved story is no longer available:{' '}
                      {slug.replaceAll('-', ' ')}
                    </p>
                    <SaveStoryButton
                      slug={slug}
                      title={slug.replaceAll('-', ' ')}
                    />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
