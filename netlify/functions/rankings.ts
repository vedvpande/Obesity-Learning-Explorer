import { asc, inArray } from 'drizzle-orm'
import { countries, obesityRates } from '../../src/db/schema.ts'
import { getDb } from '../lib/db.ts'
import { json, methodNotAllowed, serverError } from '../lib/http.ts'

// GET /api/rankings: every country with its 1990 and 2022 rate, so the
// Rankings page needs one request instead of one per country.
export default async function handler(req: Request) {
  if (req.method !== 'GET') return methodNotAllowed(['GET'])
  try {
    const db = getDb()
    const [list, rates] = await Promise.all([
      db
        .select({ code: countries.code, name: countries.name })
        .from(countries)
        .orderBy(asc(countries.name)),
      db
        .select({
          countryCode: obesityRates.countryCode,
          year: obesityRates.year,
          ratePercent: obesityRates.ratePercent,
          source: obesityRates.source,
        })
        .from(obesityRates)
        .where(inArray(obesityRates.year, [1990, 2022])),
    ])

    const rateFor = (code: string, year: number) =>
      rates.find((r) => r.countryCode === code && r.year === year)

    return json({
      source: rates[0]?.source ?? null,
      countries: list.map((c) => ({
        code: c.code,
        name: c.name,
        rate1990: rateFor(c.code, 1990)?.ratePercent ?? null,
        rate2022: rateFor(c.code, 2022)?.ratePercent ?? null,
      })),
    })
  } catch (err) {
    return serverError('GET /api/rankings', err)
  }
}

export const config = { path: '/api/rankings' }
