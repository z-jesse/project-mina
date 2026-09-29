import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import {
  getArticleVote,
  subscribeArticleVotes,
  toggleArticleVote,
} from '../lib/article-votes'
import { useAuth } from '../lib/auth'
import { setArticleFeedback } from '../server/votes.functions'
import { useArticleFeedback } from './ArticleFeedbackProvider'

export default function ArticleVotes(props: { url: string; title: string }) {
  const auth = useAuth()
  if (auth.data?.localPreview) return <LocalArticleVotes {...props} />
  return <SharedArticleVotes {...props} />
}

function SharedArticleVotes({ url, title }: { url: string; title: string }) {
  const auth = useAuth()
  const feedback = useArticleFeedback()
  const client = useQueryClient()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const row = feedback.data?.find((item) => item.url === url)
  const pending = useIsMutating({ mutationKey: ['vote', url] }) > 0
  const mutation = useMutation({
    mutationKey: ['vote', url],
    mutationFn: async (value: 1 | -1 | null) => {
      const result = await setArticleFeedback({ data: { url, value } })
      if (result.error) throw new Error(result.error)
    },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['article-feedback'] }),
        client.invalidateQueries({ queryKey: ['auth'] }),
      ])
    },
  })
  function choose(value: 1 | -1) {
    if (pending) return
    if (!auth.data?.user) {
      void navigate({ to: '/sign-in', search: { returnTo: href } })
      return
    }
    mutation.mutate(row?.ownVote === value ? null : value)
  }
  return (
    <div className="article-feedback">
      <fieldset
        className="article-votes"
        disabled={!row || pending || auth.isError}
        aria-busy={pending}
      >
        <legend className="sr-only">
          Rate this article: {title}. Community feedback on helpful coverage,
          not a factuality verdict.
        </legend>
        <button
          type="button"
          aria-label={`Helpful article: ${row?.helpful ?? 'loading'} votes`}
          aria-pressed={row?.ownVote === 1}
          title={
            auth.data?.user
              ? 'Helpful coverage. Click again to remove your vote.'
              : 'Sign in to rate this coverage.'
          }
          onClick={() => choose(1)}
        >
          <ThumbsUp size={15} aria-hidden="true" />
          <span>{row?.helpful ?? '—'}</span>
        </button>
        <button
          type="button"
          aria-label={`Unhelpful article: ${row?.unhelpful ?? 'loading'} votes`}
          aria-pressed={row?.ownVote === -1}
          title={
            auth.data?.user
              ? 'Unhelpful coverage. Click again to remove your vote.'
              : 'Sign in to rate this coverage.'
          }
          onClick={() => choose(-1)}
        >
          <ThumbsDown size={15} aria-hidden="true" />
          <span>{row?.unhelpful ?? '—'}</span>
        </button>
      </fieldset>
      {(mutation.isError || feedback.isError) && (
        <span role="alert" className="vote-error">
          {mutation.isError
            ? 'Vote wasn’t saved. Please try again.'
            : 'Votes unavailable.'}{' '}
          <button
            type="button"
            onClick={() => {
              mutation.reset()
              void feedback.refetch()
            }}
          >
            Retry
          </button>
        </span>
      )}
    </div>
  )
}

function LocalArticleVotes({ url, title }: { url: string; title: string }) {
  const vote = useSyncExternalStore(
    subscribeArticleVotes,
    () => getArticleVote(url),
    () => null,
  )

  return (
    <fieldset className="article-votes">
      <legend className="sr-only">
        Rate this article: {title}. Only your vote in this browser, not
        community totals.
      </legend>
      <button
        type="button"
        aria-label={`Helpful article: ${vote === 'helpful' ? 1 : 0} local votes`}
        aria-pressed={vote === 'helpful'}
        title="Helpful article — saved only in this browser. Click again to remove your vote."
        onClick={() => toggleArticleVote(url, 'helpful')}
      >
        <ThumbsUp size={15} aria-hidden="true" />
        <span>{vote === 'helpful' ? 1 : 0}</span>
      </button>
      <button
        type="button"
        aria-label={`Unhelpful article: ${vote === 'unhelpful' ? 1 : 0} local votes`}
        aria-pressed={vote === 'unhelpful'}
        title="Unhelpful article — saved only in this browser. Click again to remove your vote."
        onClick={() => toggleArticleVote(url, 'unhelpful')}
      >
        <ThumbsDown size={15} aria-hidden="true" />
        <span>{vote === 'unhelpful' ? 1 : 0}</span>
      </button>
    </fieldset>
  )
}
