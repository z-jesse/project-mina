import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { getTopic } from '../server/topics.functions'

export const Route = createFileRoute('/topics/$slug')({
  loader: async ({ params }) => {
    const topic = await getTopic({ data: { slug: params.slug } })
    if (!topic) throw notFound()
    return topic
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title ?? 'Topic not found'} | Games Watchdog sample topic`,
      },
      {
        name: 'description',
        content:
          loaderData?.description ?? 'This sample topic could not be found.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: TopicPage,
  notFoundComponent: () => (
    <main id="main-content" className="topic-page">
      <div className="topic-wrap topic-intro">
        <h1>Topic not found</h1>
        <p className="topic-summary">
          This topic isn’t part of the sample feed.
        </p>
        <Link to="/">Back to news</Link>
      </div>
    </main>
  ),
})

function TopicPage() {
  const topic = Route.useLoaderData()
  const [failedImage, setFailedImage] = useState<string>()
  const image = topic.image
  const outletCount = new Set(topic.articles.map((article) => article.outlet))
    .size

  return (
    <main id="main-content" className="topic-page">
      <div className="topic-wrap">
        <Link to="/" className="topic-back">
          <ArrowLeft size={15} aria-hidden="true" /> Back to news
        </Link>
        <p className="topic-sample-note">
          Historical sample · Coverage from {topic.date.slice(0, 4)}, not
          current news. Summaries are AI-written for this prototype.
        </p>
        <header className="topic-intro">
          <ul className="topic-subjects" aria-label="Related subjects">
            {topic.subjects.map((subject) => (
              <li key={subject}>
                {subject === 'Grand Theft Auto VI' ? (
                  <Link to="/games/grand-theft-auto-vi">{subject}</Link>
                ) : (
                  subject
                )}
              </li>
            ))}
          </ul>
          <h1>{topic.title}</h1>
          <p className="topic-date">
            <time dateTime={topic.date}>{topic.dateLabel}</time>
          </p>
          <p className="topic-summary">{topic.summary}</p>
          {topic.announcement && (
            <a className="topic-primary-source" href={topic.announcement.url}>
              {topic.announcement.label}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </header>
        {image && failedImage !== image.src && (
          <figure className="topic-image">
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              style={{ objectPosition: image.position ?? 'center' }}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailedImage(image.src)}
              ref={(element) => {
                if (element?.complete && element.naturalWidth === 0)
                  setFailedImage(image.src)
              }}
            />
            <figcaption>
              Image from{' '}
              <a href={image.sourceUrl}>{image.sourceName}’s coverage</a>
            </figcaption>
          </figure>
        )}
        <section className="topic-coverage" aria-labelledby="articles-title">
          <div className="topic-coverage-heading">
            <h2 id="articles-title">Articles</h2>
            <span>
              {outletCount} {outletCount === 1 ? 'outlet' : 'outlets'}
            </span>
          </div>
          <ul className="topic-article-list">
            {topic.articles.map((article) => (
              <li key={article.url}>
                <article>
                  <div className="topic-article-meta">
                    <span className="topic-outlet">{article.outlet}</span>
                    <time dateTime={article.date}>{article.dateLabel}</time>
                  </div>
                  <h3>
                    <a href={article.url}>
                      {article.title}
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </a>
                  </h3>
                  <p className="topic-article-description">
                    {article.description}
                  </p>
                  {article.author && (
                    <p className="topic-article-author">By {article.author}</p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
