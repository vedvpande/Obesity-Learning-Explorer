// Input rules for saving a fact. The real POST /api/saved-facts (#10)
// will enforce the same rules with Zod on the server.

export const NOTE_MAX_LENGTH = 280
export const MIN_YEAR = 1990
export const MAX_YEAR = 2022

export type SavedFactInput = {
  countryCode: string
  countryName: string
  year: number
  ratePercent: number
  source: string
  note: string
}

type Result = { ok: true; value: SavedFactInput } | { ok: false; error: string }

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateSavedFactInput(input: unknown): Result {
  const raw = (
    typeof input === 'object' && input !== null ? input : {}
  ) as Record<string, unknown>
  const countryCode = text(raw.countryCode)
  const countryName = text(raw.countryName)
  const source = text(raw.source)
  const note = text(raw.note)
  const { year, ratePercent } = raw

  if (!/^[A-Z]{3}$/.test(countryCode)) {
    return { ok: false, error: 'Country code must be 3 capital letters.' }
  }
  if (!countryName) return { ok: false, error: 'Country name is required.' }
  if (
    typeof year !== 'number' ||
    !Number.isInteger(year) ||
    year < MIN_YEAR ||
    year > MAX_YEAR
  ) {
    return {
      ok: false,
      error: `Year must be a whole number from ${MIN_YEAR} to ${MAX_YEAR}.`,
    }
  }
  if (
    typeof ratePercent !== 'number' ||
    !Number.isFinite(ratePercent) ||
    ratePercent < 0 ||
    ratePercent > 100
  ) {
    return { ok: false, error: 'Rate must be a number from 0 to 100.' }
  }
  if (!source) return { ok: false, error: 'Source is required.' }
  if (note.length > NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Note must be ${NOTE_MAX_LENGTH} characters or fewer.`,
    }
  }

  return {
    ok: true,
    value: { countryCode, countryName, year, ratePercent, source, note },
  }
}
