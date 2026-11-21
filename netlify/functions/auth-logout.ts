import { checkMutation } from '../lib/csrf.ts'
import { methodNotAllowed } from '../lib/http.ts'
import { clearSessionCookie } from '../lib/session.ts'

// POST /api/auth/logout: replaces the session cookie with an empty one that
// expires immediately. Only accepted from our own site (CSRF check).
export default async function handler(req: Request) {
  if (req.method !== 'POST') return methodNotAllowed(['POST'])
  const blocked = checkMutation(req)
  if (blocked) return blocked
  return new Response(null, {
    status: 204,
    headers: {
      'set-cookie': clearSessionCookie(),
      'cache-control': 'no-store',
    },
  })
}

export const config = { path: '/api/auth/logout' }
