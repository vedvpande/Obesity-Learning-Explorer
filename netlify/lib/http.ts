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

// Reads a JSON body; returns undefined if the body is missing or not JSON.
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

// Logs only the error's type, never its message, so a connection string
// or other secret can never end up in the logs.
export function serverError(where: string, err: unknown): Response {
  const kind = err instanceof Error ? err.name : typeof err
  console.error(`${where} failed (${kind})`)
  return error(500, 'Something went wrong. Please try again.')
}
