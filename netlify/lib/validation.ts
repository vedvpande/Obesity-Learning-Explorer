import { z } from 'zod'

// Every API input is checked here before it reaches the database.

export const countryCode = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Country code must be 3 capital letters')

export const year = z
  .number()
  .int('Year must be a whole number')
  .min(1990, 'Year must be from 1990 to 2022')
  .max(2022, 'Year must be from 1990 to 2022')

export const note = z
  .string()
  .trim()
  .max(280, 'Note must be 280 characters or fewer')

// GET /api/rates?country=GBR
export const ratesQuery = z.object({ country: countryCode })

// POST /api/saved-facts. The server looks up the rate and source itself,
// so the browser cannot save a made-up number. Unknown fields are refused.
export const createSavedFact = z
  .object({ countryCode, year, note: note.default('') })
  .strict()

// PATCH /api/saved-facts/:id: only the note can change.
export const updateSavedFact = z.object({ note }).strict()

// :id in /api/saved-facts/:id
export const savedFactId = z.uuid('Saved fact id must be a uuid')

// Turns Zod's error into one short message for the browser.
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input'
}
