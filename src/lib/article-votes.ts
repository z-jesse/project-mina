// Prototype-only votes. Nothing is sent to the server or included in feed ranking.
export type ArticleVote = 'helpful' | 'unhelpful' | null

const prefix = 'mina:article-vote-preview:'
const changed = 'mina:article-vote-preview-changed'
const votes = new Map<string, ArticleVote>()

function parseVote(value: string | null): ArticleVote {
  return value === 'helpful' || value === 'unhelpful' ? value : null
}

export function getArticleVote(url: string): ArticleVote {
  if (votes.has(url)) return votes.get(url) ?? null
  let vote: ArticleVote = null
  try {
    vote = parseVote(window.localStorage.getItem(prefix + url))
  } catch {
    // Storage can be unavailable; in-memory voting still works.
  }
  votes.set(url, vote)
  return vote
}

export function toggleArticleVote(
  url: string,
  choice: Exclude<ArticleVote, null>,
) {
  const vote = getArticleVote(url) === choice ? null : choice
  votes.set(url, vote)
  try {
    if (vote) window.localStorage.setItem(prefix + url, vote)
    else window.localStorage.removeItem(prefix + url)
  } catch {
    // Keep the choice for this page session when storage is blocked or full.
  }
  window.dispatchEvent(new Event(changed))
}

export function subscribeArticleVotes(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && !event.key.startsWith(prefix)) return
    if (event.key === null) votes.clear()
    else votes.delete(event.key.slice(prefix.length))
    listener()
  }
  window.addEventListener(changed, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(changed, listener)
    window.removeEventListener('storage', onStorage)
  }
}
