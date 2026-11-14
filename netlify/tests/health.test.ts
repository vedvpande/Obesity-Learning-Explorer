// @vitest-environment node
import health, { config } from '../functions/health.ts'

afterEach(() => {
  vi.unstubAllEnvs()
})

test('is served at /api/health', () => {
  expect(config.path).toBe('/api/health')
})

test('returns ok and the APP_ENV it runs in', async () => {
  vi.stubEnv('APP_ENV', 'development')
  const res = await health()
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toMatch(/application\/json/)
  expect(await res.json()).toEqual({ status: 'ok', env: 'development' })
})

test('says "local" when APP_ENV is not set', async () => {
  vi.stubEnv('APP_ENV', undefined)
  expect(await (await health()).json()).toEqual({ status: 'ok', env: 'local' })
})
