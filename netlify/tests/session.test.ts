// @vitest-environment node
import { SignJWT } from 'jose'
import {
  clearSessionCookie,
  createSessionToken,
  readCookie,
  readSessionToken,
  SESSION_MAX_AGE,
  sessionCookie,
} from '../lib/session.ts'

const SECRET = 'test-secret-that-is-long-enough-1234567890'
const USER = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', SECRET)
})
afterEach(() => {
  vi.unstubAllEnvs()
})

test('a token we created reads back as the same user', async () => {
  const token = await createSessionToken(USER)
  expect(await readSessionToken(token)).toBe(USER)
})

test('an edited token is rejected', async () => {
  const token = await createSessionToken(USER)
  const [header, , signature] = token.split('.')
  const fakeBody = Buffer.from(
    JSON.stringify({ sub: 'someone-else' }),
  ).toString('base64url')
  expect(
    await readSessionToken(`${header}.${fakeBody}.${signature}`),
  ).toBeNull()
})

test('a token signed with a different secret is rejected', async () => {
  vi.stubEnv('SESSION_SECRET', 'a-completely-different-secret-0987654321')
  const token = await createSessionToken(USER)
  vi.stubEnv('SESSION_SECRET', SECRET)
  expect(await readSessionToken(token)).toBeNull()
})

test('an expired token is rejected', async () => {
  const past = Math.floor(Date.now() / 1000) - 60
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(USER)
    .setIssuedAt(past - SESSION_MAX_AGE)
    .setExpirationTime(past)
    .sign(new TextEncoder().encode(SECRET))
  expect(await readSessionToken(token)).toBeNull()
})

test('a token with "alg: none" is rejected', async () => {
  const unsigned =
    Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url') +
    '.' +
    Buffer.from(JSON.stringify({ sub: USER })).toString('base64url') +
    '.'
  expect(await readSessionToken(unsigned)).toBeNull()
})

test('garbage is rejected', async () => {
  expect(await readSessionToken('not-a-token')).toBeNull()
})

test('a missing or short SESSION_SECRET is a server error, not "signed out"', async () => {
  vi.stubEnv('SESSION_SECRET', undefined)
  await expect(createSessionToken(USER)).rejects.toThrow(/SESSION_SECRET/)
  vi.stubEnv('SESSION_SECRET', 'too-short')
  await expect(readSessionToken('x.y.z')).rejects.toThrow(/SESSION_SECRET/)
})

test('the cookie is HttpOnly, SameSite=Lax, Path=/, 7 days and Secure', () => {
  vi.stubEnv('APP_ENV', 'production')
  const cookie = sessionCookie('abc')
  expect(cookie.split('; ')).toEqual([
    'session=abc',
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=604800',
    'Secure',
  ])
})

test.each(['development', 'staging', undefined])(
  'the cookie is Secure when APP_ENV is %s',
  (env) => {
    vi.stubEnv('APP_ENV', env)
    expect(sessionCookie('abc')).toContain('Secure')
  },
)

test('the cookie is not Secure only when APP_ENV=local (plain http)', () => {
  vi.stubEnv('APP_ENV', 'local')
  expect(sessionCookie('abc')).not.toContain('Secure')
  expect(sessionCookie('abc')).toContain('HttpOnly')
})

test('signing out sends an empty cookie that expires immediately', () => {
  vi.stubEnv('APP_ENV', 'production')
  expect(clearSessionCookie()).toBe(
    'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure',
  )
})

test('readCookie finds one cookie among several', () => {
  const req = new Request('http://localhost/', {
    headers: { cookie: 'theme=dark; session=a.b.c; other=1' },
  })
  expect(readCookie(req, 'session')).toBe('a.b.c')
  expect(readCookie(req, 'missing')).toBeNull()
  expect(readCookie(new Request('http://localhost/'), 'session')).toBeNull()
})
