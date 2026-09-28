import { config } from 'dotenv'
import { withDatabase } from '../src/db/client.server'
import { seedContent } from './seed-content'

config({ path: ['.env.local', '.env'], quiet: true })

try {
  const inserted = await withDatabase(
    seedContent,
    process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL,
  )
  console.log(
    `Inserted ${inserted} historical sample topics. Existing content was preserved.`,
  )
} catch {
  // Do not print connection details or raw driver errors from a credentialed URL.
  console.error(
    'Seeding failed. Check the development connection and apply content migrations first. No seed changes were committed.',
  )
  process.exitCode = 1
}
