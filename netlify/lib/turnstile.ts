import { ConfigError } from './config.ts'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Asks Cloudflare whether the Turnstile token from the browser is real.
// Returns true or false only; any network problem counts as "not verified".
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
    if (!res.ok) return false
    const data = (await res.json()) as { success?: unknown }
    return data.success === true
  } catch {
    return false
  }
}
