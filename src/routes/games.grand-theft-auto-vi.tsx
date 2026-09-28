import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import TopicList from '../components/TopicList'
import { sampleGtaGame, sampleTopics } from '../data/sample-topics'

export const Route = createFileRoute('/games/grand-theft-auto-vi')({
  loader: () => ({
    ...sampleGtaGame,
    topics: sampleTopics.filter((topic) =>
      topic.subjects.includes(sampleGtaGame.name),
    ),
  }),
  head: () => ({
    meta: [
      { title: 'Grand Theft Auto VI news | Games Watchdog sample game page' },
      {
        name: 'description',
        content:
          'Selected historical GTA VI news, organized into individual event topics.',
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
          Historical sample · Selected 2023–2025 coverage, not current news.
          Summaries are AI-written for this prototype.
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
