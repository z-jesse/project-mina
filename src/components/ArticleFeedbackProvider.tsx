import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext } from 'react'
import { useAuth } from '../lib/auth'
import { getArticleFeedback } from '../server/votes.functions'

function useFeedback(urls: string[]) {
  const auth = useAuth()
  return useQuery({
    queryKey: ['article-feedback', auth.data?.user?.id ?? null, urls],
    queryFn: () => getArticleFeedback({ data: { urls } }),
    enabled: Boolean(auth.data && !auth.data.localPreview),
    staleTime: 15_000,
    retry: false,
  })
}

const FeedbackContext = createContext<ReturnType<typeof useFeedback> | null>(
  null,
)

export function ArticleFeedbackProvider({
  urls,
  children,
}: {
  urls: string[]
  children: ReactNode
}) {
  const feedback = useFeedback([...new Set(urls)].sort())
  return (
    <FeedbackContext.Provider value={feedback}>
      {children}
    </FeedbackContext.Provider>
  )
}

export function useArticleFeedback() {
  const feedback = useContext(FeedbackContext)
  if (!feedback)
    throw new Error('Article votes need an ArticleFeedbackProvider.')
  return feedback
}
