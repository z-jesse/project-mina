import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import TopicList from '../components/TopicList'
import { getGameNews } from '../server/topics.functions'

export const Route = createFileRoute('/games/grand-theft-auto-vi')({
  loader: async () => {
    const game = await getGameNews()
    if (!game) throw notFound()
    return game
  },
  head: () => ({
    meta: [
      { title: 'Grand Theft Auto VI news | Games Watchdog' },
      {
        name: 'description',
        content: 'GTA VI news, organized into individual event topics.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: GamePage,
})

function GamePage() {
  const game = Route.useLoaderData()

  return (
    <main id="main-content" className="topic-page">
      <div className="topic-wrap feed-wrap">
        <Link to="/" className="topic-back">
          <ArrowLeft size={15} aria-hidden="true" /> All news
        </Link>
        <p className="topic-sample-note">
          {game.topics.length > 0 &&
          game.topics.every((topic) => topic.isSample)
            ? 'Historical samples · Selected 2023–2025 coverage. Summaries are AI-written for this prototype.'
            : 'Preview · Historical sample topics are labeled separately.'}
        </p>
        <header className="topic-intro game-intro">
          <p className="game-kind">Game</p>
          <h1>{game.name}</h1>
          <p className="game-description">{game.description}</p>
        </header>
        <section aria-label="Grand Theft Auto VI news topics">
          <div className="feed-heading">
            <p>{game.topics.length} topics · Newest first</p>
          </div>
          <TopicList topics={game.topics} showSubject={false} />
        </section>
      </div>
    </main>
  )
}
