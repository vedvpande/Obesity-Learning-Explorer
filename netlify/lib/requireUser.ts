import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../src/db/schema.ts'
import { getDb } from './db.ts'
import { error } from './http.ts'
import { readCookie, readSessionToken, SESSION_COOKIE } from './session.ts'

const uuid = z.uuid()

// Every protected function starts with:
//   const auth = await requireUser(req)
//   if (auth instanceof Response) return auth
//   ...then use auth.userId in every query.
// Answers 401 if there is no valid session or the user no longer exists.
export async function requireUser(
  req: Request,
): Promise<{ userId: string } | Response> {
  const token = readCookie(req, SESSION_COOKIE)
  if (!token) return error(401, 'Sign in to continue.')

  const userId = await readSessionToken(token)
  if (!userId || !uuid.safeParse(userId).success) {
    return error(401, 'Your session has ended. Please sign in again.')
  }

  const [user] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) return error(401, 'Your session has ended. Please sign in again.')

  return { userId }
}
