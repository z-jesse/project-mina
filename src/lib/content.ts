// Client-safe page data. Database modules must not be imported by UI components.
export type Topic = {
  isSample: boolean
  summaryIsAi: boolean
  slug: string
  title: string
  date: string
  dateLabel: string
  subjects: string[]
  summary: string
  description: string
  announcement?: { label: string; url: string }
  image?: {
    src: string
    alt: string
    sourceName: string
    sourceUrl: string
    width: number
    height: number
    position?: string
  }
  articles: {
    outlet: string
    author: string
    date: string
    dateLabel: string
    title: string
    description: string
    url: string
    image?: string
    descriptionSource?: 'publisher'
  }[]
}
