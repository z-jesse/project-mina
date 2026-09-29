import { readFile } from 'node:fs/promises'
import { config } from 'dotenv'
import { ZodError } from 'zod'
import { withDatabase } from '../src/db/client.server'
import {
  EditorialError,
  inbox,
  saveDraft,
  setPublication,
  updateCoverage,
} from './editorial'
import { eurogamer, fetchNewsFeed, importNews, newsSources } from './rss'

config({ path: ['.env.local', '.env'], quiet: true })
const [command, value, ...extra] = process.argv.slice(2)
const usage =
  'Usage: npm run content -- import [eurogamer|pc-gamer|vgc] | inbox [eurogamer|pc-gamer|vgc] | draft <json-file> | publish <slug> | unpublish <slug> | attach <slug> <article-url> <kind> | detach <slug> <article-url>'

try {
  if (
    ![
      'import',
      'inbox',
      'draft',
      'publish',
      'unpublish',
      'attach',
      'detach',
    ].includes(command) ||
    extra.length !==
      (command === 'attach' ? 2 : command === 'detach' ? 1 : 0) ||
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
  } else if (command === 'attach' || command === 'detach') {
    result = await withDatabase((db) =>
      updateCoverage(db, {
        action: command,
        slug: value,
        url: extra[0],
        ...(command === 'attach' ? { kind: extra[1] } : {}),
      }),
    )
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
