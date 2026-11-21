// @vitest-environment node
// The two-user access test, on a REAL Postgres database (PGlite, running
// inside the test) with the real migration, the real requireUser and real
// signed session cookies. Nothing about the database is faked.
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { countries, obesityRates, users } from '../../src/db/schema.ts'
import me from '../functions/auth-me.ts'
import savedFacts from '../functions/saved-facts.ts'
import { getDb } from '../lib/db.ts'
import { createSessionToken } from '../lib/session.ts'

vi.mock('../lib/db.ts', () => ({ getDb: vi.fn() }))

const SITE = 'https://dev--site.netlify.app'
const ANN = '11111111-1111-4111-8111-111111111111'
const BEN = '22222222-2222-4222-8222-222222222222'

let client: PGlite
const cookies: Record<string, string> = {}

beforeAll(async () => {
  client = new PGlite()
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: 'drizzle' })
  await db.insert(countries).values([
    { code: 'GBR', name: 'United Kingdom' },
    { code: 'FRA', name: 'France' },
  ])
  await db.insert(obesityRates).values([
    { countryCode: 'GBR', year: 2022, ratePercent: 26.99364, source: 'OWID' },
    { countryCode: 'FRA', year: 2022, ratePercent: 9.6, source: 'OWID' },
  ])
  await db.insert(users).values([
    { id: ANN, googleSub: 'google-ann', email: 'ann@example.com', name: 'Ann' },
    { id: BEN, googleSub: 'google-ben', email: 'ben@example.com', name: 'Ben' },
  ])
  vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>)

  vi.stubEnv('SESSION_SECRET', 'test-secret-that-is-long-enough-1234567890')
  cookies.ann = `session=${await createSessionToken(ANN)}`
  cookies.ben = `session=${await createSessionToken(BEN)}`
}, 30_000)

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', 'test-secret-that-is-long-enough-1234567890')
  vi.stubEnv('APP_URL', SITE)
})
afterAll(async () => {
  vi.unstubAllEnvs()
  await client.close()
})

function as(
  who: 'ann' | 'ben' | null,
  method: string,
  path: string,
  body?: unknown,
) {
  return savedFacts(
    new Request(`${SITE}${path}`, {
      method,
      headers: {
        origin: SITE,
        'content-type': 'application/json',
        ...(who ? { cookie: cookies[who] } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
}

async function listFor(who: 'ann' | 'ben') {
  const res = await as(who, 'GET', '/api/saved-facts')
  expect(res.status).toBe(200)
  return (await res.json()) as {
    id: string
    note: string
    countryCode: string
  }[]
}

test('Ann saves a fact; Ben cannot read, change or delete it', async () => {
  // Ann creates a fact.
  const created = await as('ann', 'POST', '/api/saved-facts', {
    countryCode: 'GBR',
    year: 2022,
    note: 'Ann private note',
  })
  expect(created.status).toBe(201)
  const fact = (await created.json()) as { id: string; ratePercent: number }
  expect(fact.ratePercent).toBe(26.99364) // copied from the database

  // READ: Ann sees it; Ben's list is empty.
  expect((await listFor('ann')).map((f) => f.id)).toEqual([fact.id])
  expect(await listFor('ben')).toEqual([])

  // UPDATE: Ben gets 404 (as if it didn't exist); Ann's note is unchanged.
  const benEdit = await as('ben', 'PATCH', `/api/saved-facts?id=${fact.id}`, {
    note: 'Ben was here',
  })
  expect(benEdit.status).toBe(404)
  expect((await listFor('ann'))[0]?.note).toBe('Ann private note')

  // DELETE: Ben gets 404; Ann's fact still exists.
  const benDelete = await as('ben', 'DELETE', `/api/saved-facts?id=${fact.id}`)
  expect(benDelete.status).toBe(404)
  expect(await listFor('ann')).toHaveLength(1)

  // Ann herself can edit and delete it.
  const annEdit = await as('ann', 'PATCH', `/api/saved-facts?id=${fact.id}`, {
    note: 'Edited by Ann',
  })
  expect(annEdit.status).toBe(200)
  expect((await listFor('ann'))[0]?.note).toBe('Edited by Ann')
  expect(
    (await as('ann', 'DELETE', `/api/saved-facts?id=${fact.id}`)).status,
  ).toBe(204)
  expect(await listFor('ann')).toEqual([])
})

test('each user only ever lists their own facts', async () => {
  await as('ann', 'POST', '/api/saved-facts', {
    countryCode: 'GBR',
    year: 2022,
  })
  await as('ben', 'POST', '/api/saved-facts', {
    countryCode: 'FRA',
    year: 2022,
  })
  expect((await listFor('ann')).map((f) => f.countryCode)).toEqual(['GBR'])
  expect((await listFor('ben')).map((f) => f.countryCode)).toEqual(['FRA'])
})

test('/api/auth/me returns only the caller’s own details', async () => {
  const res = await me(
    new Request(`${SITE}/api/auth/me`, { headers: { cookie: cookies.ben! } }),
  )
  expect(await res.json()).toEqual({ name: 'Ben', email: 'ben@example.com' })
})

test('signed out, or with a forged cookie: 401 and no data', async () => {
  expect((await as(null, 'GET', '/api/saved-facts')).status).toBe(401)
  const forged = await savedFacts(
    new Request(`${SITE}/api/saved-facts`, {
      headers: { cookie: 'session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.bad' },
    }),
  )
  expect(forged.status).toBe(401)
})

test('a deleted user’s still-valid cookie stops working', async () => {
  const gone = '33333333-3333-4333-8333-333333333333'
  const cookie = `session=${await createSessionToken(gone)}`
  const res = await savedFacts(
    new Request(`${SITE}/api/saved-facts`, { headers: { cookie } }),
  )
  expect(res.status).toBe(401)
})
