import { ConfigError } from './config.ts'

// Small helpers so every function answers with JSON and the right status.
export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export function error(status: number, message: string): Response {
  return json({ error: message }, status)
}

export function methodNotAllowed(allowed: string[]): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'content-type': 'application/json', allow: allowed.join(', ') },
  })
}

// Reads a JSON body; returns undefined if it is missing, not JSON, or larger
// than maxBytes (even if the client didn't send a Content-Length).
export async function readJson(
  req: Request,
  maxBytes = 4096,
): Promise<unknown> {
  try {
    const text = await req.text()
    if (new TextEncoder().encode(text).length > maxBytes) return undefined
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// A Postgres SQLSTATE code (e.g. 42703 = unknown column) is five letters or
// digits and never contains data, so it is safe to log. Drizzle sometimes
// wraps the database error, so look one level down in `cause` too.
function postgresCode(err: unknown): string | null {
  for (const e of [err, err instanceof Error ? err.cause : undefined]) {
    if (e && typeof e === 'object' && 'code' in e) {
      const code = (e as { code: unknown }).code
      if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code
    }
  }
  return null
}

// Logs only safe facts, never an error's message, so a connection string
// or other secret can never end up in the logs:
// - a missing setting  → its NAME (e.g. "SESSION_SECRET must be set ...")
// - a database error   → the Postgres error code
// - anything else      → the error's type
// The user always gets the same generic message.
export function serverError(where: string, err: unknown): Response {
  if (err instanceof ConfigError) {
    console.error(`${where} failed: ${err.message}`)
  } else {
    const kind = err instanceof Error ? err.name : typeof err
    const code = postgresCode(err)
    console.error(
      `${where} failed (${kind}${code ? `, Postgres code ${code}` : ''})`,
    )
  }
  return error(500, 'Something went wrong. Please try again.')
}
