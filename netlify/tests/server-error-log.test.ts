import { afterEach, describe, expect, test, vi } from 'vitest'
import { ConfigError } from '../lib/config.ts'
import { serverError } from '../lib/http.ts'
import { verifyTurnstile } from '../lib/turnstile.ts'
import { createSessionToken } from '../lib/session.ts'

function logged(): string {
  const spy = vi.mocked(console.error)
  return spy.mock.calls.map((c) => c.join(' ')).join('\n')
}

describe('serverError logging', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  test('a missing setting is logged by NAME; the user sees a generic message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = serverError('POST /api/x', new ConfigError('SESSION_SECRET'))

    expect(logged()).toBe('POST /api/x failed: SESSION_SECRET is not set')
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('SESSION_SECRET')
  })

  test('a database error logs its Postgres code, not its message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const dbErr = Object.assign(
      new Error('column "google_sub" does not exist, password=hunter2'),
      { code: '42703' },
    )
    serverError('POST /api/x', dbErr)

    expect(logged()).toBe('POST /api/x failed (Error, Postgres code 42703)')
  })

  test('finds the Postgres code on a wrapped error (cause)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const cause = Object.assign(new Error('secret detail'), { code: '42P01' })
    serverError('GET /api/x', new Error('Failed query', { cause }))

    expect(logged()).toBe('GET /api/x failed (Error, Postgres code 42P01)')
  })

  test('any other error logs only its type, never its message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    serverError('GET /api/x', new TypeError('postgres://user:pw@host/db'))
    serverError(
      'GET /api/x',
      Object.assign(new Error('x'), { code: 'not a sqlstate' }),
    )

    expect(logged()).toBe(
      'GET /api/x failed (TypeError)\nGET /api/x failed (Error)',
    )
  })

  test('helpers throw ConfigError naming the missing variable', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    await expect(verifyTurnstile('token')).rejects.toMatchObject({
      name: 'ConfigError',
      variable: 'TURNSTILE_SECRET_KEY',
    })

    vi.stubEnv('SESSION_SECRET', 'too-short')
    await expect(createSessionToken('user')).rejects.toMatchObject({
      name: 'ConfigError',
      variable: 'SESSION_SECRET',
    })
  })
})
