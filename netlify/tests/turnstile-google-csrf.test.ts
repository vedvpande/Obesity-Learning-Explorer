// @vitest-environment node
import { checkMutation, MAX_BODY_BYTES } from '../lib/csrf.ts'
import { verifyGoogleIdToken } from '../lib/google.ts'
import { verifyTurnstile } from '../lib/turnstile.ts'

const verifyIdToken = vi.fn()
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(function () {
    return { verifyIdToken }
  }),
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  verifyIdToken.mockReset()
})

describe('verifyTurnstile', () => {
  beforeEach(() => vi.stubEnv('TURNSTILE_SECRET_KEY', 'turnstile-secret'))

  function cloudflareAnswers(body: unknown, ok = true) {
    const fetchMock = vi.fn(() =>
      Promise.resolve(Response.json(body, { status: ok ? 200 : 500 })),
    )
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  test('true when Cloudflare says success, sending secret, token and IP', async () => {
    const fetchMock = cloudflareAnswers({ success: true })
    expect(await verifyTurnstile('tok', '1.2.3.4')).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    )
    const sent = new URLSearchParams(init.body as URLSearchParams)
    expect(sent.get('secret')).toBe('turnstile-secret')
    expect(sent.get('response')).toBe('tok')
    expect(sent.get('remoteip')).toBe('1.2.3.4')
  })

  test.each([
    [{ success: false }, true],
    [{ success: 'true' }, true],
    [{}, true],
    [{ success: true }, false],
  ])('false for %j (http ok: %s)', async (body, ok) => {
    cloudflareAnswers(body, ok)
    expect(await verifyTurnstile('tok')).toBe(false)
  })

  test('false when Cloudflare cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    expect(await verifyTurnstile('tok')).toBe(false)
  })

  test('a missing secret is a server error', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', undefined)
    await expect(verifyTurnstile('tok')).rejects.toThrow(/TURNSTILE_SECRET_KEY/)
  })
})

describe('verifyGoogleIdToken', () => {
  beforeEach(() => vi.stubEnv('GOOGLE_CLIENT_ID', 'our-client-id'))

  const payload = (p: Record<string, unknown>) =>
    verifyIdToken.mockResolvedValue({ getPayload: () => p })

  test('returns sub, email and name, checking OUR client id as audience', async () => {
    payload({ sub: '123', email: 'a@b.c', email_verified: true, name: 'Ann' })
    expect(await verifyGoogleIdToken('id-token')).toEqual({
      sub: '123',
      email: 'a@b.c',
      name: 'Ann',
    })
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'id-token',
      audience: 'our-client-id',
    })
  })

  test('a missing name is allowed', async () => {
    payload({ sub: '123', email: 'a@b.c', email_verified: true })
    expect(await verifyGoogleIdToken('t')).toMatchObject({ name: null })
  })

  test.each([
    [{ sub: '123', email: 'a@b.c', email_verified: false }],
    [{ sub: '123', email: 'a@b.c' }],
    [{ email: 'a@b.c', email_verified: true }],
    [{ sub: '123', email_verified: true }],
  ])('null for an unusable payload %j', async (p) => {
    payload(p)
    expect(await verifyGoogleIdToken('t')).toBeNull()
  })

  test('null when Google rejects the token (bad signature, expired, wrong audience)', async () => {
    verifyIdToken.mockRejectedValue(new Error('Wrong recipient'))
    expect(await verifyGoogleIdToken('t')).toBeNull()
  })

  test('a missing GOOGLE_CLIENT_ID is a server error', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', undefined)
    await expect(verifyGoogleIdToken('t')).rejects.toThrow(/GOOGLE_CLIENT_ID/)
  })
})

describe('checkMutation (CSRF)', () => {
  beforeEach(() => vi.stubEnv('APP_URL', 'https://dev--site.netlify.app'))

  const req = (method: string, headers: Record<string, string>) =>
    new Request('https://dev--site.netlify.app/api/saved-facts', {
      method,
      headers,
    })
  const json = { 'content-type': 'application/json' }
  const ours = { origin: 'https://dev--site.netlify.app' }

  test('GET is never blocked', () => {
    expect(checkMutation(req('GET', {}))).toBeNull()
  })

  test('POST from our own site with JSON is allowed', () => {
    expect(checkMutation(req('POST', { ...ours, ...json }))).toBeNull()
  })

  test.each([
    ['no Origin', json],
    ['another website', { ...json, origin: 'https://evil.example' }],
    [
      'a look-alike address',
      { ...json, origin: 'https://dev--site.netlify.app.evil.example' },
    ],
  ])('POST from %s → 403', (_label, headers) => {
    expect(checkMutation(req('POST', headers))?.status).toBe(403)
  })

  test('POST that is not JSON (e.g. a form) → 415', () => {
    const r = req('POST', { ...ours, 'content-type': 'text/plain' })
    expect(checkMutation(r)?.status).toBe(415)
  })

  test('DELETE needs our Origin but no JSON body', () => {
    expect(checkMutation(req('DELETE', ours))).toBeNull()
    expect(checkMutation(req('DELETE', {}))?.status).toBe(403)
  })

  test('a body over the size limit → 413', () => {
    const r = req('PATCH', {
      ...ours,
      ...json,
      'content-length': String(MAX_BODY_BYTES + 1),
    })
    expect(checkMutation(r)?.status).toBe(413)
  })

  test('without APP_URL or APP_ENV, a same-site request is still allowed', () => {
    vi.stubEnv('APP_URL', undefined)
    vi.stubEnv('APP_ENV', undefined)
    const local = new Request('http://localhost:8888/api/x', {
      method: 'POST',
      headers: { ...json, origin: 'http://localhost:8888' },
    })
    expect(checkMutation(local)).toBeNull()
  })

  test('without APP_URL, another website is still blocked', () => {
    vi.stubEnv('APP_URL', undefined)
    const fromEvil = new Request('http://localhost:8888/api/x', {
      method: 'POST',
      headers: { ...json, origin: 'https://evil.example' },
    })
    expect(checkMutation(fromEvil)?.status).toBe(403)
  })

  test('a different port on the same computer counts as another site', () => {
    vi.stubEnv('APP_URL', undefined)
    const otherPort = new Request('http://localhost:8888/api/x', {
      method: 'POST',
      headers: { ...json, origin: 'http://localhost:3000' },
    })
    expect(checkMutation(otherPort)?.status).toBe(403)
  })

  test('a badly written APP_URL is ignored, not trusted', () => {
    vi.stubEnv('APP_URL', 'not a url')
    expect(
      checkMutation(req('POST', { origin: 'not a url', ...json }))?.status,
    ).toBe(403)
  })
})
