// GET /api/health: a tiny check that the API is up and which environment
// it runs in. Returns no user or health data, so it needs no login.
export default async function health() {
  return Response.json({ status: 'ok', env: process.env.APP_ENV ?? 'local' })
}

export const config = { path: '/api/health' }
