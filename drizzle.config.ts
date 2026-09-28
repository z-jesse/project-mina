import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'], quiet: true })

export default defineConfig({
  out: './drizzle',
  // The starter's unrelated todos demo is not managed by content migrations.
  schema: './src/db/content-schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL ?? '',
  },
})
