import { createFileRoute } from '@tanstack/react-router'
import TopicList from '../components/TopicList'
import { sampleTopics } from '../data/sample-topics'

export const Route = createFileRoute('/')({
  loader: () => sampleTopics,
  head: () => ({
    meta: [
      { title: 'News | Games Watchdog sample feed' },
      {
        name: 'description',
        content:
          'A sample gaming news feed with coverage grouped around specific events.',
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
          Historical sample · Selected 2023–2025 coverage, not live news.
          Summaries are AI-written for this prototype.
        </p>
        <header className="feed-heading">
          <h1>News</h1>
          <p>{topics.length} topics · Newest first</p>
        </header>
        <TopicList topics={topics} />
      </div>
    </main>
  )
}
