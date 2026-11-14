import type { Country, RateRow } from '../mocks/countries.ts'

export const START_YEAR = 1990
export const END_YEAR = 2022

export type RankingRow = {
  code: string
  name: string
  rate1990: number | undefined
  rate2022: number | undefined
  // Percentage points, rounded to 1 decimal so 0.1 + 0.2 style noise never shows.
  change: number | undefined
}

export type SortKey = 'name' | 'rate1990' | 'rate2022' | 'change'
export type SortDirection = 'ascending' | 'descending'

function rateFor(rates: RateRow[], code: string, year: number) {
  const value = rates.find(
    (r) => r.countryCode === code && r.year === year,
  )?.ratePercent
  return value !== undefined && Number.isFinite(value) ? value : undefined
}

export function buildRankingRows(
  countries: Country[],
  rates: RateRow[],
): RankingRow[] {
  return countries.map((c) => {
    const rate1990 = rateFor(rates, c.code, START_YEAR)
    const rate2022 = rateFor(rates, c.code, END_YEAR)
    const change =
      rate1990 !== undefined && rate2022 !== undefined
        ? Math.round((rate2022 - rate1990) * 10) / 10
        : undefined
    return { code: c.code, name: c.name, rate1990, rate2022, change }
  })
}

// Rows with no data always go last, whichever direction is chosen.
export function sortRows(
  rows: RankingRow[],
  key: SortKey,
  direction: SortDirection,
): RankingRow[] {
  const sign = direction === 'ascending' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (key === 'name') return sign * a.name.localeCompare(b.name)
    const x = a[key]
    const y = b[key]
    if (x === undefined && y === undefined) return a.name.localeCompare(b.name)
    if (x === undefined) return 1
    if (y === undefined) return -1
    return sign * (x - y) || a.name.localeCompare(b.name)
  })
}

export function formatRate(value: number | undefined) {
  return value === undefined ? 'No data' : value.toFixed(1)
}

export function formatChange(value: number | undefined) {
  if (value === undefined) return 'No data'
  if (value === 0) return '0.0'
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}`
}
