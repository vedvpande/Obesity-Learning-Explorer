// @vitest-environment node
import { getDb } from '../lib/db.ts'
import { requireUser } from '../lib/requireUser.ts'
import { createSessionToken } from '../lib/session.ts'

vi.mock('../lib/db.ts', () => ({ getDb: vi.fn() }))

const USER = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

// Stand-in for Drizzle's select(...).from(...).where(...).limit(1)
function usersInDb(ids: string[]) {
  vi.mocked(getDb).mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(ids.map((id) => ({ id }))),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof getDb>)
}

const withCookie = (cookie?: string) =>
  new Request('http://localhost/api/saved-facts', {
    headers: cookie ? { cookie } : {},
  })

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', 'test-secret-that-is-long-enough-1234567890')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getDb).mockReset()
})

test('no cookie → 401, and the database is not touched', async () => {
  const result = await requireUser(withCookie())
  expect(result).toBeInstanceOf(Response)
  expect((result as Response).status).toBe(401)
  expect(getDb).not.toHaveBeenCalled()
})

test('a forged cookie → 401', async () => {
  const result = await requireUser(withCookie('session=forged.token.here'))
  expect((result as Response).status).toBe(401)
  expect(getDb).not.toHaveBeenCalled()
})

test('a valid cookie for a user that exists → that user id', async () => {
  usersInDb([USER])
  const token = await createSessionToken(USER)
  expect(await requireUser(withCookie(`session=${token}`))).toEqual({
    userId: USER,
  })
})

test('a valid cookie for a deleted user → 401', async () => {
  usersInDb([])
  const token = await createSessionToken(USER)
  const result = await requireUser(withCookie(`session=${token}`))
  expect((result as Response).status).toBe(401)
})

test('a valid signature but a user id that is not a uuid → 401', async () => {
  const token = await createSessionToken('not-a-uuid')
  const result = await requireUser(withCookie(`session=${token}`))
  expect((result as Response).status).toBe(401)
  expect(getDb).not.toHaveBeenCalled()
})

test('the 401 body is a short message with no details', async () => {
  const result = (await requireUser(withCookie())) as Response
  expect(await result.json()).toEqual({ error: 'Sign in to continue.' })
})
