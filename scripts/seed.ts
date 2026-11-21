// npm run db:seed
// Loads countries and obesity rates from data/obesity_countries.csv and
// creates the fake Demo Student user (id = DEMO_USER_ID). Safe to run again:
// existing rows are updated, never duplicated. Never prints DATABASE_URL.
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { neon } from '@neondatabase/serverless'
import { count, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { countries, obesityRates, savedFacts, users } from '../src/db/schema.ts'
import { OWID_SOURCE, parseRatesCsv } from '../src/db/seedData.ts'

const { DATABASE_URL, DEMO_USER_ID } = process.env
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example)')
// The demo user is only for development and staging, never production.
const seedDemoUser = process.env.APP_ENV !== 'production'
if (seedDemoUser && !z.uuid().safeParse(DEMO_USER_ID).success) {
  throw new Error('DEMO_USER_ID must be set to a uuid (see .env.example)')
}

const db = drizzle(neon(DATABASE_URL))
const parsed = parseRatesCsv(readFileSync('data/obesity_countries.csv', 'utf8'))

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

for (const batch of chunks(parsed.countries, 500)) {
  await db
    .insert(countries)
    .values(batch)
    .onConflictDoUpdate({
      target: countries.code,
      set: { name: sql`excluded.name`, updatedAt: sql`now()` },
    })
}

for (const batch of chunks(parsed.rates, 500)) {
  await db
    .insert(obesityRates)
    .values(batch.map((r) => ({ ...r, source: OWID_SOURCE })))
    .onConflictDoUpdate({
      target: [obesityRates.countryCode, obesityRates.year],
      set: {
        ratePercent: sql`excluded.rate_percent`,
        source: sql`excluded.source`,
        updatedAt: sql`now()`,
      },
    })
}

if (seedDemoUser && DEMO_USER_ID) {
  await db
    .insert(users)
    .values({
      id: DEMO_USER_ID,
      googleSub: 'demo-student',
      email: 'demo@example.com',
      name: 'Demo Student',
    })
    .onConflictDoNothing()
}

const [c] = await db.select({ n: count() }).from(countries)
const [r] = await db.select({ n: count() }).from(obesityRates)
const [u] = await db.select({ n: count() }).from(users)
const [f] = await db.select({ n: count() }).from(savedFacts)
console.log(
  `Seeded. Rows now: countries=${c?.n}, obesity_rates=${r?.n}, users=${u?.n}, saved_facts=${f?.n}. Skipped CSV rows (regions or invalid): ${parsed.skipped}.`,
)
