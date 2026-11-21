import { eq } from 'drizzle-orm'
import { users } from '../../src/db/schema.ts'
import { getDb } from '../lib/db.ts'
import { error, methodNotAllowed, serverError } from '../lib/http.ts'
import { requireUser } from '../lib/requireUser.ts'

// GET /api/auth/me: who is signed in? Only the signed-in user's own name
// and email (never their id or anyone else's data). 401 if signed out.
export default async function handler(req: Request) {
  if (req.method !== 'GET') return methodNotAllowed(['GET'])
  try {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth

    const [me] = await getDb()
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)
    if (!me) return error(401, 'Sign in to continue.')

    return new Response(JSON.stringify(me), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    return serverError('GET /api/auth/me', err)
  }
}

export const config = { path: '/api/auth/me' }
