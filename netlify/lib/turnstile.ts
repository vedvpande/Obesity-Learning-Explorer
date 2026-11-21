import { ConfigError } from './config.ts'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Cloudflare's reason codes look like "invalid-input-secret" or
// "timeout-or-duplicate". They never contain the token or the secret, but
// we only keep values of that exact shape so nothing else reaches the log.
function reasonCodes(data: unknown): string {
  const raw =
    data && typeof data === 'object' && 'error-codes' in data
      ? (data as { 'error-codes': unknown })['error-codes']
      : undefined
  const codes = Array.isArray(raw)
    ? raw
        .filter((c): c is string => typeof c === 'string')
        .filter((c) => /^[a-z-]{1,40}$/.test(c))
        .slice(0, 5)
    : []
  return codes.length ? codes.join(', ') : 'no reason given'
}

// Asks Cloudflare whether the Turnstile token from the browser is real.
// Returns true or false only; any network problem counts as "not verified".
// On a "no", logs Cloudflare's reason code so the cause is visible in the
// Netlify function log (e.g. invalid-input-response = keys don't match).
export async function verifyTurnstile(
  token: string,
  ip?: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) throw new ConfigError('TURNSTILE_SECRET_KEY')

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error(`Turnstile check failed: Cloudflare HTTP ${res.status}`)
      return false
    }
    const data: unknown = await res.json()
    const success =
      !!data &&
      typeof data === 'object' &&
      'success' in data &&
      data.success === true
    if (!success) console.error(`Turnstile check failed: ${reasonCodes(data)}`)
    return success
  } catch (err) {
    const kind = err instanceof Error ? err.name : typeof err
    console.error(`Turnstile check failed: Cloudflare unreachable (${kind})`)
    return false
  }
}
