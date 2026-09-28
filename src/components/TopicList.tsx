import { Link } from '@tanstack/react-router'
import type { Topic } from '../lib/content'
import ArticleThumbnail from './ArticleThumbnail'

export default function TopicList({
  topics,
  showSubject = true,
}: {
  topics: Topic[]
  showSubject?: boolean
}) {
  return (
    <ul className="feed-list">
      {topics.map((topic) => (
        <li key={topic.slug}>
          <article>
            <Link
              to="/topics/$slug"
              params={{ slug: topic.slug }}
              className="feed-topic-link"
              aria-labelledby={`title-${topic.slug}`}
            >
              {showSubject && (
                <p className="feed-subject">{topic.subjects[0]}</p>
              )}
              <h2 id={`title-${topic.slug}`}>{topic.title}</h2>
              <p className="feed-description">{topic.description}</p>
              <p className="feed-meta">
                {topic.isSample && <span>Historical sample</span>}
                {!topic.isSample && topic.summaryIsAi && (
                  <span>AI-assisted summary</span>
                )}
                <time dateTime={topic.date}>{topic.dateLabel}</time>
                <span>
                  {topic.articles.length}{' '}
                  {topic.articles.length === 1 ? 'article' : 'articles'}
                </span>
              </p>
              <ArticleThumbnail src={topic.image?.src} />
            </Link>
          </article>
        </li>
      ))}
    </ul>
  )
}
