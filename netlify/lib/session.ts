import { jwtVerify, SignJWT } from 'jose'

// The session is a signed token (HS256 with SESSION_SECRET) that holds only
// the user's id. Nobody can read a secret from it or change it without the
// signature failing.

export const SESSION_COOKIE = 'session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days, in seconds

// A missing or short secret is a server mistake, so it throws (500)
// instead of quietly treating everyone as signed out.
function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set (at least 32 characters)')
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey())
}

// Returns the user id, or null if the token is forged, edited or expired.
export async function readSessionToken(token: string): Promise<string | null> {
  const key = secretKey()
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

function cookieAttributes(maxAge: number): string[] {
  const parts = ['HttpOnly', 'SameSite=Lax', 'Path=/', `Max-Age=${maxAge}`]
  // Secure everywhere except plain-http local development.
  if (process.env.APP_ENV !== 'local') parts.push('Secure')
  return parts
}

export function sessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    ...cookieAttributes(SESSION_MAX_AGE),
  ].join('; ')
}

export function clearSessionCookie(): string {
  return [`${SESSION_COOKIE}=`, ...cookieAttributes(0)].join('; ')
}

// Reads one cookie from the request's Cookie header.
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=') || null
  }
  return null
}
