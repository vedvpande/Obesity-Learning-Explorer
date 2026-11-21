// @vitest-environment node
import signIn, { config as signInConfig } from '../functions/auth-google.ts'
import logout, { config as logoutConfig } from '../functions/auth-logout.ts'
import me, { config as meConfig } from '../functions/auth-me.ts'
import { getDb } from '../lib/db.ts'
import { verifyGoogleIdToken } from '../lib/google.ts'
import { createSessionToken } from '../lib/session.ts'
import { verifyTurnstile } from '../lib/turnstile.ts'

vi.mock('../lib/db.ts', () => ({ getDb: vi.fn() }))
vi.mock('../lib/turnstile.ts', () => ({ verifyTurnstile: vi.fn() }))
vi.mock('../lib/google.ts', () => ({ verifyGoogleIdToken: vi.fn() }))

const SITE = 'https://dev--site.netlify.app'
const USER = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
const profile = { sub: 'google-123', email: 'ann@example.com', name: 'Ann' }

// Records what the endpoint asked the database to do.
const insertValues = vi.fn()
const conflictSet = vi.fn()
function fakeDb({ meRow = { name: 'Ann', email: 'ann@example.com' } } = {}) {
  vi.mocked(getDb).mockReturnValue({
    insert: () => ({
      values: (v: unknown) => {
        insertValues(v)
        return {
          onConflictDoUpdate: (c: { set: unknown }) => {
            conflictSet(c.set)
            return {
              returning: () =>
                Promise.resolve([
                  { id: USER, name: 'Ann', email: 'ann@example.com' },
                ]),
            }
          },
        }
      },
    }),
    select: (cols: Record<string, unknown>) => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve(
              'id' in cols ? [{ id: USER }] : meRow ? [meRow] : [],
            ),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof getDb>)
}

const post = (url: string, body?: unknown, origin = SITE) =>
  new Request(`${SITE}${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const goodBody = { credential: 'google-id-token', turnstileToken: 'ts-token' }

beforeEach(() => {
  vi.stubEnv('APP_URL', SITE)
  vi.stubEnv('APP_ENV', 'development')
  vi.stubEnv('SESSION_SECRET', 'test-secret-that-is-long-enough-1234567890')
  vi.mocked(verifyTurnstile).mockResolvedValue(true)
  vi.mocked(verifyGoogleIdToken).mockResolvedValue(profile)
  fakeDb()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getDb).mockReset()
  vi.mocked(verifyTurnstile).mockReset()
  vi.mocked(verifyGoogleIdToken).mockReset()
  insertValues.mockReset()
  conflictSet.mockReset()
})

test('the three endpoints live under /api/auth', () => {
  expect(signInConfig.path).toBe('/api/auth/google')
  expect(meConfig.path).toBe('/api/auth/me')
  expect(logoutConfig.path).toBe('/api/auth/logout')
})

describe('POST /api/auth/google', () => {
  test('success: finds or creates the user by Google sub and sets the cookie', async () => {
    const res = await signIn(post('/api/auth/google', goodBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ name: 'Ann', email: 'ann@example.com' })

    expect(insertValues).toHaveBeenCalledWith({
      googleSub: 'google-123',
      email: 'ann@example.com',
      name: 'Ann',
    })
    expect(conflictSet).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ann@example.com', name: 'Ann' }),
    )
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/^session=[\w-]+\.[\w-]+\.[\w-]+; /)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Secure')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  test('the response never includes the user id', async () => {
    const res = await signIn(post('/api/auth/google', goodBody))
    expect(await res.text()).not.toContain(USER)
  })

  test('Turnstile is checked FIRST: if it fails, Google and the database are never called', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(false)
    const res = await signIn(post('/api/auth/google', goodBody))
    expect(res.status).toBe(403)
    expect(verifyTurnstile).toHaveBeenCalledWith('ts-token', null)
    expect(verifyGoogleIdToken).not.toHaveBeenCalled()
    expect(insertValues).not.toHaveBeenCalled()
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  test('a bad Google token → 401, no user created, no cookie', async () => {
    vi.mocked(verifyGoogleIdToken).mockResolvedValue(null)
    const res = await signIn(post('/api/auth/google', goodBody))
    expect(res.status).toBe(401)
    expect(insertValues).not.toHaveBeenCalled()
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  test.each([
    ['no body', undefined],
    ['a missing Turnstile token', { credential: 'x' }],
    ['a missing Google credential', { turnstileToken: 'x' }],
    ['an empty credential', { credential: '', turnstileToken: 'x' }],
    ['extra fields', { ...goodBody, userId: 'someone' }],
  ])('400 for %s, and nothing is verified', async (_label, body) => {
    const res = await signIn(post('/api/auth/google', body))
    expect(res.status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
  })

  test('another website cannot sign someone in (403)', async () => {
    const res = await signIn(
      post('/api/auth/google', goodBody, 'https://evil.example'),
    )
    expect(res.status).toBe(403)
    expect(verifyTurnstile).not.toHaveBeenCalled()
  })

  test('GET is not allowed (405)', async () => {
    const res = await signIn(new Request(`${SITE}/api/auth/google`))
    expect(res.status).toBe(405)
  })

  test('a server problem → 500 with no details', async () => {
    vi.mocked(verifyTurnstile).mockRejectedValue(
      new Error('TURNSTILE_SECRET_KEY is not set'),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await signIn(post('/api/auth/google', goodBody))
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('TURNSTILE')
  })
})

describe('GET /api/auth/me', () => {
  test('signed out → 401', async () => {
    const res = await me(new Request(`${SITE}/api/auth/me`))
    expect(res.status).toBe(401)
  })

  test('signed in → only my name and email', async () => {
    const token = await createSessionToken(USER)
    const res = await me(
      new Request(`${SITE}/api/auth/me`, {
        headers: { cookie: `session=${token}` },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ name: 'Ann', email: 'ann@example.com' })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  test('POST is not allowed (405)', async () => {
    const res = await me(post('/api/auth/me', {}))
    expect(res.status).toBe(405)
  })
})

describe('POST /api/auth/logout', () => {
  test('clears the cookie (204)', async () => {
    const res = await logout(post('/api/auth/logout'))
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toContain('session=;')
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  test('another website cannot sign you out (403)', async () => {
    const res = await logout(
      post('/api/auth/logout', undefined, 'https://evil.example'),
    )
    expect(res.status).toBe(403)
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})
