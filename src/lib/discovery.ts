import type { Topic } from './content'

const aliases: Record<string, string> = {
  'Grand Theft Auto VI': 'GTA 6 GTA6 GTA VI',
  'PC gaming': 'PC',
  'Nintendo Switch 2': 'Nintendo Switch',
}

export const subjectLabel = (subject: string) =>
  subject === 'Grand Theft Auto VI'
    ? 'GTA 6'
    : subject === 'PC gaming'
      ? 'PC'
      : subject

const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

export function filterTopics(topics: Topic[], query = '', subject?: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return topics.filter((topic) => {
    if (subject && !topic.subjects.includes(subject)) return false
    const text = normalize(
      [
        topic.title,
        topic.description,
        ...topic.subjects.flatMap((name) => [name, aliases[name] ?? '']),
        ...topic.articles.flatMap((article) => [article.title, article.outlet]),
      ].join(' '),
    )
    return terms.every((term) => text.includes(term))
  })
}

export function discoverSubjects(topics: Topic[]) {
  const available = new Set(topics.flatMap((topic) => topic.subjects))
  const preferred = [
    'Grand Theft Auto VI',
    'PC gaming',
    'Xbox',
    'Nintendo Switch 2',
    'Minecraft',
    'Steam',
  ]
  return [
    ...new Set([
      ...preferred.filter((subject) => available.has(subject)),
      ...topics.map((topic) => topic.subjects[0]).filter(Boolean),
    ]),
  ].slice(0, 9)
}
