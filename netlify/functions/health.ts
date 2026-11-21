import { sql } from 'drizzle-orm'
import { getDb } from '../lib/db.ts'

// Answers true/false only: never an error message or connection detail.
async function databaseReachable(timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const ping = getDb().execute(sql`select 1`)
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
    })
    await Promise.race([ping, timeout])
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

// GET /api/health: is the API up, which environment, and can it reach the
// database? Returns no user or health data, so it needs no login.
export default async function health() {
  return Response.json({
    status: 'ok',
    env: process.env.APP_ENV ?? 'local',
    database: await databaseReachable(),
  })
}

export const config = { path: '/api/health' }
