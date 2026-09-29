import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { Topic } from '../lib/content'
import { ArticleFeedbackProvider } from './ArticleFeedbackProvider'
import ArticleThumbnail from './ArticleThumbnail'
import ArticleVotes from './ArticleVotes'
import SaveStoryButton from './SaveStoryButton'

export default function TopicList({
  topics,
  showSubject = true,
}: {
  topics: Topic[]
  showSubject?: boolean
}) {
  return (
    <ArticleFeedbackProvider
      urls={topics.flatMap((topic) =>
        topic.articles.map((article) => article.url),
      )}
    >
      <ul className="feed-list">
        {topics.map((topic) => {
          const singleArticle =
            topic.articles.length === 1 ? topic.articles[0] : undefined

          return (
            <li key={topic.slug}>
              <article
                className="feed-card"
                aria-labelledby={`title-${topic.slug}`}
              >
                {showSubject && (
                  <p className="feed-subject">
                    <Link to="/" search={{ subject: topic.subjects[0] }}>
                      {topic.subjects[0]}
                    </Link>
                  </p>
                )}
                <h2 id={`title-${topic.slug}`}>
                  <Link to="/topics/$slug" params={{ slug: topic.slug }}>
                    {topic.title}
                  </Link>
                </h2>
                {topic.description && (
                  <p className="feed-description">{topic.description}</p>
                )}
                <p className="feed-meta">
                  {topic.isSample && <span>Historical sample</span>}
                  {!topic.isSample && topic.summaryIsAi && (
                    <span>AI-assisted summary</span>
                  )}
                  <time
                    dateTime={topic.date}
                    title={`Event date: ${topic.dateLabel}`}
                  >
                    {topic.dateLabel}
                  </time>
                  <SaveStoryButton slug={topic.slug} title={topic.title} />
                </p>
                <ArticleThumbnail
                  src={topic.image?.src ?? singleArticle?.image}
                />
                {topic.articles.length > 0 && (
                  <details className="feed-read-options">
                    <summary>
                      {topic.articles.length}{' '}
                      {singleArticle
                        ? `article · ${singleArticle.outlet}`
                        : 'articles'}
                    </summary>
                    <ul>
                      {topic.articles.map((article) => (
                        <li key={article.url}>
                          <a href={article.url}>
                            <span>
                              <span className="feed-read-outlet">
                                Read at {article.outlet}
                              </span>
                              <span className="feed-read-title">
                                {article.title}
                              </span>
                            </span>
                            <ArrowUpRight size={14} aria-hidden="true" />
                          </a>
                          <ArticleVotes
                            url={article.url}
                            title={article.title}
                          />
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            </li>
          )
        })}
      </ul>
    </ArticleFeedbackProvider>
  )
}
