const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'always' })

export function formatRelativeTime(date: string, now: number): string | undefined {
  // Date-only records have no known publication time.
  if (!date.includes('T')) return undefined
  const elapsed = now - Date.parse(date)
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= 7 * 86_400_000)
    return undefined
  if (elapsed < 60_000) return 'Just now'
  if (elapsed < 3_600_000)
    return relativeTime.format(-Math.floor(elapsed / 60_000), 'minute')
  if (elapsed < 86_400_000)
    return relativeTime.format(-Math.floor(elapsed / 3_600_000), 'hour')
  return relativeTime.format(-Math.floor(elapsed / 86_400_000), 'day')
}
