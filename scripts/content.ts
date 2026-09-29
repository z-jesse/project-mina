import { readFile } from 'node:fs/promises'
import { config } from 'dotenv'
import { ZodError } from 'zod'
import { withDatabase } from '../src/db/client.server'
import { EditorialError, inbox, saveDraft, setPublication } from './editorial'
import { eurogamer, fetchNewsFeed, importNews, newsSources } from './rss'

config({ path: ['.env.local', '.env'], quiet: true })
const [command, value, ...extra] = process.argv.slice(2)
const usage =
  'Usage: npm run content -- import [eurogamer|pc-gamer] | inbox [eurogamer|pc-gamer] | draft <json-file> | publish <slug> | unpublish <slug>'

try {
  if (
    !['import', 'inbox', 'draft', 'publish', 'unpublish'].includes(command) ||
    extra.length ||
    (!['import', 'inbox'].includes(command) && !value)
  )
    throw new EditorialError(usage)
  const source = newsSources.find((candidate) => candidate.slug === value)
  if (['import', 'inbox'].includes(command) && value && !source)
    throw new EditorialError(usage)
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/mina_development'
  ) {
    throw new EditorialError(
      'This prototype command only writes to local mina_development.',
    )
  }
  let result: unknown
  if (command === 'import') {
    const feed = await fetchNewsFeed(source ?? eurogamer)
    result = await withDatabase((db) => importNews(db, feed))
  } else if (command === 'inbox') {
    result = await withDatabase((db) => inbox(db, source?.slug))
  } else if (command === 'draft') {
    const input: unknown = JSON.parse(await readFile(value, 'utf8'))
    result = await withDatabase((db) => saveDraft(db, input))
  } else {
    result = await withDatabase((db) =>
      setPublication(db, value, command === 'publish'),
    )
  }
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  // Driver/parser errors can contain credentials or publisher content.
  if (error instanceof EditorialError) console.error(error.message)
  else if (error instanceof ZodError)
    console.error(
      `Invalid draft fields: ${error.issues.map((issue) => issue.path.join('.') || 'draft').join(', ')}`,
    )
  else
    console.error(
      `${usage}\nCommand failed. Check the local connection, migration, feed, and draft file. No partial database changes were saved.`,
    )
  process.exitCode = 1
}
