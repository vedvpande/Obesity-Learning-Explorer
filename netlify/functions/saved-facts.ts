import { and, count, desc, eq } from 'drizzle-orm'
import { countries, obesityRates, savedFacts } from '../../src/db/schema.ts'
import { checkMutation } from '../lib/csrf.ts'
import { getDb } from '../lib/db.ts'
import {
  error,
  json,
  methodNotAllowed,
  readJson,
  serverError,
} from '../lib/http.ts'
import { requireUser } from '../lib/requireUser.ts'
import {
  createSavedFact,
  firstIssue,
  savedFactId,
  updateSavedFact,
} from '../lib/validation.ts'

// A student report never needs more; it also stops anyone filling the
// database by scripting POST requests.
export const MAX_SAVED_FACTS = 200

// The columns every response returns for a saved fact.
const factColumns = {
  id: savedFacts.id,
  countryCode: savedFacts.countryCode,
  countryName: countries.name,
  year: savedFacts.year,
  ratePercent: savedFacts.ratePercent,
  source: savedFacts.source,
  note: savedFacts.note,
  createdAt: savedFacts.createdAt,
}

// /api/saved-facts          GET (list mine, newest first), POST (create)
// /api/saved-facts?id=…     PATCH (change my note), DELETE (remove mine)
// Every query filters on the signed-in user's id, so another user's fact
// is never returned or changed: it simply answers 404.
export default async function handler(req: Request) {
  // Changes must come from our own site, as JSON (CSRF protection).
  const blocked = checkMutation(req)
  if (blocked) return blocked

  let userId: string
  try {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth
    userId = auth.userId
  } catch (err) {
    return serverError('saved-facts sign-in check', err)
  }

  // The id travels as ?id=… (not a path segment): query strings are never
  // rewritten, while netlify dev appends ".html" to unknown paths.
  const rawId = new URL(req.url).searchParams.get('id')
  if (rawId === null) {
    if (req.method === 'GET') return list(userId)
    if (req.method === 'POST') return create(userId, await readJson(req))
    return methodNotAllowed(['GET', 'POST'])
  }

  const id = savedFactId.safeParse(rawId)
  if (!id.success) return error(400, firstIssue(id.error))
  if (req.method === 'PATCH')
    return update(userId, id.data, await readJson(req))
  if (req.method === 'DELETE') return remove(userId, id.data)
  return methodNotAllowed(['PATCH', 'DELETE'])
}

async function list(userId: string) {
  try {
    const rows = await getDb()
      .select(factColumns)
      .from(savedFacts)
      .innerJoin(countries, eq(countries.code, savedFacts.countryCode))
      .where(eq(savedFacts.userId, userId))
      .orderBy(desc(savedFacts.createdAt))
      .limit(MAX_SAVED_FACTS)
    return json(rows)
  } catch (err) {
    return serverError('GET /api/saved-facts', err)
  }
}

async function create(userId: string, body: unknown) {
  const input = createSavedFact.safeParse(body)
  if (!input.success) return error(400, firstIssue(input.error))
  const { countryCode, year, note } = input.data

  try {
    const db = getDb()
    const [mine] = await db
      .select({ n: count() })
      .from(savedFacts)
      .where(eq(savedFacts.userId, userId))
    if ((mine?.n ?? 0) >= MAX_SAVED_FACTS) {
      return error(
        409,
        `You can save up to ${MAX_SAVED_FACTS} facts. Delete some to save more.`,
      )
    }

    // Copy the real rate and source from the database, never from the browser.
    const [fact] = await db
      .select({
        name: countries.name,
        ratePercent: obesityRates.ratePercent,
        source: obesityRates.source,
      })
      .from(obesityRates)
      .innerJoin(countries, eq(countries.code, obesityRates.countryCode))
      .where(
        and(
          eq(obesityRates.countryCode, countryCode),
          eq(obesityRates.year, year),
        ),
      )
    if (!fact) return error(404, 'No data for that country and year')

    const [saved] = await db
      .insert(savedFacts)
      .values({
        userId,
        countryCode,
        year,
        ratePercent: fact.ratePercent,
        source: fact.source,
        note,
      })
      .returning()
    if (!saved) return serverError('POST /api/saved-facts', 'no row')
    return json(
      {
        id: saved.id,
        countryCode,
        countryName: fact.name,
        year,
        ratePercent: saved.ratePercent,
        source: saved.source,
        note: saved.note,
        createdAt: saved.createdAt,
      },
      201,
    )
  } catch (err) {
    return serverError('POST /api/saved-facts', err)
  }
}

async function update(userId: string, id: string, body: unknown) {
  const input = updateSavedFact.safeParse(body)
  if (!input.success) return error(400, firstIssue(input.error))

  try {
    const [changed] = await getDb()
      .update(savedFacts)
      .set({ note: input.data.note })
      .where(and(eq(savedFacts.id, id), eq(savedFacts.userId, userId)))
      .returning({ id: savedFacts.id, note: savedFacts.note })
    if (!changed) return error(404, 'Saved fact not found')
    return json(changed)
  } catch (err) {
    return serverError('PATCH /api/saved-facts', err)
  }
}

async function remove(userId: string, id: string) {
  try {
    const [deleted] = await getDb()
      .delete(savedFacts)
      .where(and(eq(savedFacts.id, id), eq(savedFacts.userId, userId)))
      .returning({ id: savedFacts.id })
    if (!deleted) return error(404, 'Saved fact not found')
    return new Response(null, { status: 204 })
  } catch (err) {
    return serverError('DELETE /api/saved-facts', err)
  }
}

export const config = { path: '/api/saved-facts' }
