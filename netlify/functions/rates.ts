import { asc, eq } from 'drizzle-orm'
import { countries, obesityRates } from '../../src/db/schema.ts'
import { getDb } from '../lib/db.ts'
import { error, json, methodNotAllowed, serverError } from '../lib/http.ts'
import { firstIssue, ratesQuery } from '../lib/validation.ts'

// GET /api/rates?country=GBR: one country's rates for 1990-2022.
// 400 for a badly formed code, 404 for a code with no data.
export default async function handler(req: Request) {
  if (req.method !== 'GET') return methodNotAllowed(['GET'])

  const query = ratesQuery.safeParse({
    country: new URL(req.url).searchParams.get('country') ?? undefined,
  })
  if (!query.success) return error(400, firstIssue(query.error))

  try {
    const rows = await getDb()
      .select({
        name: countries.name,
        year: obesityRates.year,
        ratePercent: obesityRates.ratePercent,
        source: obesityRates.source,
      })
      .from(obesityRates)
      .innerJoin(countries, eq(countries.code, obesityRates.countryCode))
      .where(eq(obesityRates.countryCode, query.data.country))
      .orderBy(asc(obesityRates.year))

    const first = rows[0]
    if (!first) return error(404, 'No data for that country')
    return json({
      country: { code: query.data.country, name: first.name },
      rates: rows.map(({ year, ratePercent, source }) => ({
        year,
        ratePercent,
        source,
      })),
    })
  } catch (err) {
    return serverError('GET /api/rates', err)
  }
}

export const config = { path: '/api/rates' }
