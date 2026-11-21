import { OAuth2Client } from 'google-auth-library'

export type GoogleProfile = { sub: string; email: string; name: string | null }

let client: OAuth2Client | undefined

// Checks the Google ID token from the sign-in button with Google's official
// library: signature, expiry, and that it was made for OUR app
// (audience = GOOGLE_CLIENT_ID). Returns null for any invalid token.
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile | null> {
  const audience = process.env.GOOGLE_CLIENT_ID
  if (!audience) throw new Error('GOOGLE_CLIENT_ID is not set')
  client ??= new OAuth2Client()

  try {
    const ticket = await client.verifyIdToken({ idToken, audience })
    const p = ticket.getPayload()
    if (!p?.sub || !p.email || p.email_verified !== true) return null
    return { sub: p.sub, email: p.email, name: p.name ?? null }
  } catch {
    return null
  }
}
