// @vitest-environment node
import savedFacts, { MAX_SAVED_FACTS } from '../functions/saved-facts.ts'
import { getDb } from '../lib/db.ts'

vi.mock('../lib/db.ts', () => ({ getDb: vi.fn() }))

const DEMO = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

// A tiny stand-in for Drizzle: the count query answers `existing`, and
// insert must never be reached when the user is at the limit.
function fakeDb(existing: number) {
  const insert = vi.fn()
  vi.mocked(getDb).mockReturnValue({
    select: () => ({
      from: () => ({ where: () => Promise.resolve([{ n: existing }]) }),
    }),
    insert,
  } as unknown as ReturnType<typeof getDb>)
  return insert
}

const post = () =>
  savedFacts(
    new Request('http://localhost/api/saved-facts', {
      method: 'POST',
      body: JSON.stringify({ countryCode: 'GBR', year: 2022 }),
    }),
  )

beforeEach(() => {
  vi.stubEnv('DEMO_USER_ID', DEMO)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getDb).mockReset()
})

test('the limit is 200 saved facts per user', () => {
  expect(MAX_SAVED_FACTS).toBe(200)
})

test('refuses with 409 when the user already has the maximum', async () => {
  const insert = fakeDb(MAX_SAVED_FACTS)
  const res = await post()
  expect(res.status).toBe(409)
  expect(await res.json()).toEqual({
    error: 'You can save up to 200 facts. Delete some to save more.',
  })
  expect(insert).not.toHaveBeenCalled()
})

test('a signed-out request in production never reaches the database', async () => {
  vi.stubEnv('APP_ENV', 'production')
  const res = await post()
  expect(res.status).toBe(401)
  expect(getDb).not.toHaveBeenCalled()
})
