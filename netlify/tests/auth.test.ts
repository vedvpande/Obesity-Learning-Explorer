// @vitest-environment node
import { currentUserId } from '../lib/auth.ts'

const DEMO = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

afterEach(() => {
  vi.unstubAllEnvs()
})

test('acts as the demo user in development', () => {
  vi.stubEnv('APP_ENV', 'development')
  vi.stubEnv('DEMO_USER_ID', DEMO)
  expect(currentUserId()).toBe(DEMO)
})

test('acts as the demo user locally (no APP_ENV) and on staging', () => {
  vi.stubEnv('DEMO_USER_ID', DEMO)
  vi.stubEnv('APP_ENV', undefined)
  expect(currentUserId()).toBe(DEMO)
  vi.stubEnv('APP_ENV', 'staging')
  expect(currentUserId()).toBe(DEMO)
})

test('NEVER acts as the demo user in production, even if it is set', () => {
  vi.stubEnv('APP_ENV', 'production')
  vi.stubEnv('DEMO_USER_ID', DEMO)
  expect(currentUserId()).toBeNull()
})

test.each([undefined, '', 'demo', '-'.repeat(36), `${DEMO}x`])(
  'treats a missing or invalid DEMO_USER_ID (%s) as signed out',
  (value) => {
    vi.stubEnv('APP_ENV', 'development')
    vi.stubEnv('DEMO_USER_ID', value)
    expect(currentUserId()).toBeNull()
  },
)
