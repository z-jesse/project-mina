import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { currentUser, requireSameOrigin, requireUser } from './auth.server'
import { readArticleVotes, writeArticleVote } from './votes.server'

const url = z.string().url().max(2000)

// A read-only POST keeps a batch of source URLs out of the query-string limit.
export const getArticleFeedback = createServerFn({ method: 'POST' })
  .validator(z.object({ urls: z.array(url).max(1000) }))
  .handler(async ({ data }) => {
    requireSameOrigin()
    if (process.env.CONTENT_SOURCE !== 'database') return []
    const user = await currentUser()
    return readArticleVotes([...new Set(data.urls)], user?.id ?? null)
  })

export const setArticleFeedback = createServerFn({ method: 'POST' })
  .validator(
    z.object({ url, value: z.union([z.literal(1), z.literal(-1), z.null()]) }),
  )
  .handler(async ({ data }) => {
    requireSameOrigin()
    const user = await requireUser()
    if (process.env.CONTENT_SOURCE !== 'database')
      return { error: 'Voting is only available with the content database.' }
    return writeArticleVote(data.url, user.id, data.value)
  })
