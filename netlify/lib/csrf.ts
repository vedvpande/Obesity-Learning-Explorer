import { error } from './http.ts'

export const MAX_BODY_BYTES = 4096

// Our own site's addresses: the one this request was sent to, plus APP_URL
// when it is set. A page on another website always sends ITS address as
// Origin, so it can never match either of these.
function allowedOrigins(req: Request): Set<string> {
  const allowed = new Set([new URL(req.url).origin])
  const appUrl = process.env.APP_URL
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin)
    } catch {
      // ignore a badly written APP_URL
    }
  }
  return allowed
}

// Now that sign-in uses a cookie, another website could try to make the
// browser send a request on the user's behalf (CSRF). For POST, PATCH and
// DELETE we only accept requests from our own site's address, sending JSON,
// and not too large. Returns a Response to send back, or null if it's fine.
export function checkMutation(req: Request): Response | null {
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) return null

  const origin = req.headers.get('origin')
  if (!origin || !allowedOrigins(req).has(origin)) {
    return error(403, 'Request blocked.')
  }

  if (req.method !== 'DELETE') {
    const type = req.headers.get('content-type') ?? ''
    if (!type.toLowerCase().startsWith('application/json')) {
      return error(415, 'Send the request as JSON.')
    }
  }

  const length = Number(req.headers.get('content-length') ?? '0')
  if (length > MAX_BODY_BYTES) return error(413, 'Request is too large.')

  return null
}
