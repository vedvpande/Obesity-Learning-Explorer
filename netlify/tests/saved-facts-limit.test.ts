// @vitest-environment node
import savedFacts, { MAX_SAVED_FACTS } from '../functions/saved-facts.ts'
import { getDb } from '../lib/db.ts'

vi.mock('../lib/db.ts', () => ({ getDb: vi.fn() }))
vi.mock('../lib/requireUser.ts', () => ({
  requireUser: vi.fn((req: Request) =>
    Promise.resolve(
      req.headers.get('cookie')
        ? { userId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' }
        : Response.json({ error: 'Sign in to continue.' }, { status: 401 }),
    ),
  ),
}))

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

const post = ({ signedIn = true } = {}) =>
  savedFacts(
    new Request('http://localhost/api/saved-facts', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
        ...(signedIn ? { cookie: 'session=test' } : {}),
      },
      body: JSON.stringify({ countryCode: 'GBR', year: 2022 }),
    }),
  )

beforeEach(() => {
  vi.stubEnv('APP_URL', 'http://localhost')
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

test('a signed-out request never reaches the database', async () => {
  const res = await post({ signedIn: false })
  expect(res.status).toBe(401)
  expect(getDb).not.toHaveBeenCalled()
})
