import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { z } from 'zod'
import * as schema from './schema'

const databaseUrl = z
  .string()
  .url()
  .refine(
    (value) =>
      value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'Expected a PostgreSQL connection URL',
  )

// Workers sockets belong to one request. Use Supabase's transaction pooler for
// runtime connections; do not keep a Node Pool or Client across Worker requests.
export async function withDatabase<T>(
  run: (db: NodePgDatabase<typeof schema>) => Promise<T>,
  connectionString = process.env.DATABASE_URL,
) {
  const parsed = databaseUrl.safeParse(connectionString)
  if (!parsed.success)
    throw new Error('Configure a valid server-side DATABASE_URL.')
  const client = new Client({
    connectionString: parsed.data,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  })
  try {
    await client.connect()
  } catch (error) {
    // A failed Workers socket may never emit the close event awaited by end().
    // Request cleanup, but let the connection error reach the caller immediately.
    void client.end().catch(() => {})
    throw error
  }
  try {
    return await run(drizzle(client, { schema }))
  } finally {
    await client.end()
  }
}
