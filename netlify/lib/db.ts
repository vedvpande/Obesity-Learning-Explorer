import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { ConfigError } from './config.ts'

let db: ReturnType<typeof drizzle> | undefined

// One Drizzle client per function instance, created on first use.
// DATABASE_URL comes from the environment only and is never logged.
export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new ConfigError('DATABASE_URL')
    db = drizzle(neon(url))
  }
  return db
}
