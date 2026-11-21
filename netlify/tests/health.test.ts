// @vitest-environment node
import health, { config } from '../functions/health.ts'
import { getDb } from '../lib/db.ts'

vi.mock('../lib/db.ts', () => ({ getDb: vi.fn() }))

function databaseAnswers(ok: boolean) {
  vi.mocked(getDb).mockReturnValue({
    execute: ok
      ? () => Promise.resolve({ rows: [] })
      : () => Promise.reject(new Error('postgres://secret@host/db')),
  } as unknown as ReturnType<typeof getDb>)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getDb).mockReset()
})

test('is served at /api/health', () => {
  expect(config.path).toBe('/api/health')
})

test('returns ok, the APP_ENV it runs in, and database: true', async () => {
  vi.stubEnv('APP_ENV', 'development')
  databaseAnswers(true)
  const res = await health()
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toMatch(/application\/json/)
  expect(await res.json()).toEqual({
    status: 'ok',
    env: 'development',
    database: true,
  })
})

test('says "local" when APP_ENV is not set', async () => {
  vi.stubEnv('APP_ENV', undefined)
  databaseAnswers(true)
  expect(await (await health()).json()).toMatchObject({ env: 'local' })
})

test('reports database: false (and no error details) when the database fails', async () => {
  databaseAnswers(false)
  const text = await (await health()).text()
  expect(JSON.parse(text)).toMatchObject({ status: 'ok', database: false })
  expect(text).not.toMatch(/postgres|secret|error/i)
})

test('reports database: false when DATABASE_URL is missing', async () => {
  vi.mocked(getDb).mockImplementation(() => {
    throw new Error('DATABASE_URL is not set')
  })
  expect(await (await health()).json()).toMatchObject({ database: false })
})
