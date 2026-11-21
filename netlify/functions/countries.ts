import { asc } from 'drizzle-orm'
import { countries } from '../../src/db/schema.ts'
import { getDb } from '../lib/db.ts'
import { json, methodNotAllowed, serverError } from '../lib/http.ts'

// GET /api/countries: every country, sorted by name. Public reference data.
export default async function handler(req: Request) {
  if (req.method !== 'GET') return methodNotAllowed(['GET'])
  try {
    const rows = await getDb()
      .select({ code: countries.code, name: countries.name })
      .from(countries)
      .orderBy(asc(countries.name))
    return json(rows)
  } catch (err) {
    return serverError('GET /api/countries', err)
  }
}

export const config = { path: '/api/countries' }
