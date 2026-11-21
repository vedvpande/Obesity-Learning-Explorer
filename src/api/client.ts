import type { ExploreData, NewSavedFact, RateRow, SavedFact } from './types.ts'

// Every call to our own API goes through here, so errors look the same
// everywhere: an ApiError with the HTTP status and the server's message.
export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  })
  if (res.status === 204) return undefined as T
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String(body.error)
        : 'Something went wrong. Please try again.'
    throw new ApiError(res.status, message)
  }
  return body as T
}

type Rankings = {
  source: string | null
  countries: {
    code: string
    name: string
    rate1990: number | null
    rate2022: number | null
  }[]
}

// Explore and Rankings both need every country with its 1990 and 2022
// rates, which /api/rankings returns in a single request.
export async function fetchExploreData(): Promise<ExploreData> {
  const { source, countries } = await request<Rankings>('/api/rankings')
  const rates: RateRow[] = []
  for (const c of countries) {
    for (const [year, ratePercent] of [
      [1990, c.rate1990],
      [2022, c.rate2022],
    ] as const) {
      if (ratePercent !== null && source !== null) {
        rates.push({ countryCode: c.code, year, ratePercent, source })
      }
    }
  }
  return {
    countries: countries.map(({ code, name }) => ({ code, name })),
    rates,
  }
}

export function listSavedFacts() {
  return request<SavedFact[]>('/api/saved-facts')
}

export function createSavedFact(fact: NewSavedFact) {
  return request<SavedFact>('/api/saved-facts', {
    method: 'POST',
    body: JSON.stringify(fact),
  })
}

export function updateSavedFactNote(id: string, note: string) {
  return request<{ id: string; note: string }>(
    `/api/saved-facts?id=${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ note }) },
  )
}

export function deleteSavedFact(id: string) {
  return request<void>(`/api/saved-facts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
