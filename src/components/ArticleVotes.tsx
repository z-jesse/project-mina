import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import {
  getArticleVote,
  subscribeArticleVotes,
  toggleArticleVote,
} from '../lib/article-votes'

export default function ArticleVotes({
  url,
  title,
}: {
  url: string
  title: string
}) {
  const vote = useSyncExternalStore(
    subscribeArticleVotes,
    () => getArticleVote(url),
    () => null,
  )

  return (
    <fieldset className="article-votes">
      <legend className="sr-only">Rate this article: {title}</legend>
      <button
        type="button"
        aria-label={`Helpful article: ${vote === 'helpful' ? 1 : 0} local votes`}
        aria-pressed={vote === 'helpful'}
        title="Helpful article — click again to remove your vote"
        onClick={() => toggleArticleVote(url, 'helpful')}
      >
        <ThumbsUp size={15} aria-hidden="true" />
        <span>{vote === 'helpful' ? 1 : 0}</span>
      </button>
      <button
        type="button"
        aria-label={`Unhelpful article: ${vote === 'unhelpful' ? 1 : 0} local votes`}
        aria-pressed={vote === 'unhelpful'}
        title="Unhelpful article — click again to remove your vote"
        onClick={() => toggleArticleVote(url, 'unhelpful')}
      >
        <ThumbsDown size={15} aria-hidden="true" />
        <span>{vote === 'unhelpful' ? 1 : 0}</span>
      </button>
      <span
        className="article-votes-note"
        title="Only your vote in this browser; these are not community totals."
      >
        Local preview
        <span className="sr-only">
          {' '}
          — only your vote, not community totals.
        </span>
      </span>
    </fieldset>
  )
}
