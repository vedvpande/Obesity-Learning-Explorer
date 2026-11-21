import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../src/db/schema.ts'
import { checkMutation } from '../lib/csrf.ts'
import { getDb } from '../lib/db.ts'
import { verifyGoogleIdToken } from '../lib/google.ts'
import { error, methodNotAllowed, readJson, serverError } from '../lib/http.ts'
import { createSessionToken, sessionCookie } from '../lib/session.ts'
import { verifyTurnstile } from '../lib/turnstile.ts'

const signInBody = z
  .object({
    credential: z.string().min(1, 'Missing Google sign-in').max(4096),
    turnstileToken: z.string().min(1, 'Missing human check').max(2048),
  })
  .strict()

// POST /api/auth/google  { credential, turnstileToken }
// 1. Turnstile first (bots are stopped before we call Google)  → 403
// 2. Google ID token, checked on the server for OUR client id   → 401
// 3. Find or create the user by Google "sub" (update name/email)
// 4. Set the signed session cookie                              → 200
export default async function handler(req: Request) {
  if (req.method !== 'POST') return methodNotAllowed(['POST'])
  const blocked = checkMutation(req)
  if (blocked) return blocked

  const input = signInBody.safeParse(await readJson(req))
  if (!input.success) {
    return error(400, input.error.issues[0]?.message ?? 'Invalid input')
  }

  try {
    const ip = req.headers.get('x-nf-client-connection-ip')
    if (!(await verifyTurnstile(input.data.turnstileToken, ip))) {
      return error(403, 'The human check failed. Please try again.')
    }

    const profile = await verifyGoogleIdToken(input.data.credential)
    if (!profile) {
      return error(
        401,
        "Google sign-in couldn't be verified. Please try again.",
      )
    }

    const [user] = await getDb()
      .insert(users)
      .values({
        googleSub: profile.sub,
        email: profile.email,
        name: profile.name,
      })
      .onConflictDoUpdate({
        target: users.googleSub,
        set: {
          email: profile.email,
          name: profile.name,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: users.id, name: users.name, email: users.email })
    if (!user) return serverError('POST /api/auth/google', 'no user row')

    const token = await createSessionToken(user.id)
    return new Response(
      JSON.stringify({ name: user.name, email: user.email }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
          'set-cookie': sessionCookie(token),
        },
      },
    )
  } catch (err) {
    return serverError('POST /api/auth/google', err)
  }
}

export const config = { path: '/api/auth/google' }
