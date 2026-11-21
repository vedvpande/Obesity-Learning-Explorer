// @vitest-environment node
// Status codes that are decided before the database is touched.
// (The real database behaviour is tested in two-users.test.ts.)
import countries from '../functions/countries.ts'
import rankings from '../functions/rankings.ts'
import rates from '../functions/rates.ts'
import savedFacts, {
  config as savedFactsConfig,
} from '../functions/saved-facts.ts'
import { getDb } from '../lib/db.ts'

vi.mock('../lib/db.ts', () => ({
  getDb: vi.fn(() => {
    throw new Error('the database must not be reached in these tests')
  }),
}))

// Signed in = has a cookie. requireUser itself is tested in requireUser.test.ts.
vi.mock('../lib/requireUser.ts', () => ({
  requireUser: vi.fn((req: Request) =>
    Promise.resolve(
      req.headers.get('cookie')
        ? { userId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' }
        : Response.json({ error: 'Sign in to continue.' }, { status: 401 }),
    ),
  ),
}))

const ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
const SITE = 'http://localhost'
const url = (path: string) => `${SITE}${path}`

function call(
  method: string,
  path: string,
  { body, signedIn = true }: { body?: unknown; signedIn?: boolean } = {},
) {
  return savedFacts(
    new Request(url(path), {
      method,
      headers: {
        origin: SITE,
        'content-type': 'application/json',
        ...(signedIn ? { cookie: 'session=test' } : {}),
      },
      body:
        body === undefined
          ? undefined
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
    }),
  )
}

beforeEach(() => {
  vi.stubEnv('APP_URL', SITE)
})
afterEach(() => {
  vi.unstubAllEnvs()
  expect(getDb).not.toHaveBeenCalled()
  vi.mocked(getDb).mockClear()
})

test('saved-facts is served at /api/saved-facts (id goes in ?id=)', () => {
  expect(savedFactsConfig.path).toBe('/api/saved-facts')
})

describe('401 when nobody is signed in', () => {
  test.each(['GET', 'POST', 'PATCH', 'DELETE'])('%s', async (method) => {
    const withId = method === 'PATCH' || method === 'DELETE'
    const res = await call(
      method,
      `/api/saved-facts${withId ? `?id=${ID}` : ''}`,
      {
        signedIn: false,
      },
    )
    expect(res.status).toBe(401)
  })
})

describe('403 when a change comes from another website (CSRF)', () => {
  test.each(['POST', 'PATCH', 'DELETE'])('%s', async (method) => {
    const res = await savedFacts(
      new Request(url(`/api/saved-facts?id=${ID}`), {
        method,
        headers: {
          origin: 'https://evil.example',
          'content-type': 'application/json',
          cookie: 'session=test',
        },
      }),
    )
    expect(res.status).toBe(403)
  })
})

describe('400 for bad input', () => {
  test.each([
    ['a missing body', ''],
    ['broken JSON', '{"countryCode":'],
    ['a bad year', { countryCode: 'GBR', year: 1800 }],
    ['a lowercase code', { countryCode: 'gbr', year: 2022 }],
    [
      'a note over 280 characters',
      { countryCode: 'GBR', year: 2022, note: 'a'.repeat(281) },
    ],
    [
      'a rate sent by the browser',
      { countryCode: 'GBR', year: 2022, ratePercent: 1 },
    ],
    [
      'a body over 4 KB',
      { countryCode: 'GBR', year: 2022, note: 'a'.repeat(5000) },
    ],
  ])('POST with %s', async (_label, body) => {
    const res = await call('POST', '/api/saved-facts', { body })
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error')
  })

  test('PATCH with an id that is not a uuid', async () => {
    const res = await call('PATCH', '/api/saved-facts?id=123', {
      body: { note: 'x' },
    })
    expect(res.status).toBe(400)
  })

  test('PATCH with a note that is too long', async () => {
    const res = await call('PATCH', `/api/saved-facts?id=${ID}`, {
      body: { note: 'a'.repeat(281) },
    })
    expect(res.status).toBe(400)
  })

  test('an id ending in .html is rejected, not trusted', async () => {
    const res = await call('DELETE', `/api/saved-facts?id=${ID}.html`)
    expect(res.status).toBe(400)
  })

  test.each(['', '?country=gbr', '?country=GB', "?country=GBR'--"])(
    'GET /api/rates%s',
    async (query) => {
      const res = await rates(new Request(url(`/api/rates${query}`)))
      expect(res.status).toBe(400)
    },
  )
})

describe('405 for the wrong method, with an Allow header', () => {
  test.each([
    ['countries', countries, 'GET'],
    ['rates', rates, 'GET'],
    ['rankings', rankings, 'GET'],
  ] as const)('POST /api/%s', async (_name, handler, allowed) => {
    const res = await handler(new Request(url('/api/x'), { method: 'POST' }))
    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe(allowed)
  })

  test('PUT /api/saved-facts', async () => {
    const res = await call('PUT', '/api/saved-facts')
    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('GET, POST')
  })
})
