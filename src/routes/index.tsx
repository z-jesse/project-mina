import { createFileRoute } from '@tanstack/react-router'
import TopicList from '../components/TopicList'
import { getNews } from '../server/topics.functions'

export const Route = createFileRoute('/')({
  loader: () => getNews(),
  head: () => ({
    meta: [
      { title: 'News | Games Watchdog' },
      {
        name: 'description',
        content: 'Gaming news with coverage grouped around specific events.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: NewsPage,
})

function NewsPage() {
  const topics = Route.useLoaderData()
  return (
    <main id="main-content" className="topic-page feed-page">
      <div className="topic-wrap feed-wrap">
        <p className="topic-sample-note">
          {topics.length > 0 && topics.every((topic) => topic.isSample)
            ? 'Historical samples · Selected 2023–2025 coverage. Summaries are AI-written for this prototype.'
            : 'Preview · Historical sample topics are labeled separately.'}
        </p>
        <header className="feed-heading">
          <h1>News</h1>
          <p>{topics.length} stories · Newest first</p>
        </header>
        <TopicList topics={topics} />
        {!topics.length && <p>No published topics yet.</p>}
      </div>
    </main>
  )
}
