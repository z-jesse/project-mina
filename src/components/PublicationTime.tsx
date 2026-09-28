import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../lib/relative-time'

export default function PublicationTime({
  date,
  dateLabel,
}: {
  date: string
  dateLabel: string
}) {
  const [now, setNow] = useState<number>()

  useEffect(() => {
    if (!date.includes('T')) return
    let timer: number | undefined
    const update = () => {
      const currentTime = Date.now()
      setNow(currentTime)
      // Fixed dates do not need a timer; stop once relative time ages out.
      if (formatRelativeTime(date, currentTime))
        timer = window.setTimeout(update, 60_000)
    }
    update()
    return () => window.clearTimeout(timer)
  }, [date])

  // Keep SSR and the first client render identical; enhance after hydration.
  const relative = now === undefined ? undefined : formatRelativeTime(date, now)

  return (
    <time dateTime={date} title={dateLabel}>
      {relative ?? dateLabel}
      {relative && <span className="sr-only"> ({dateLabel})</span>}
    </time>
  )
}
