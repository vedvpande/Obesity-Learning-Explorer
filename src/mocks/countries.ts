// TEST DATA ONLY. The app now loads real data from /api (see src/api/client.ts).
// Tests use these small, fixed values so they never need a database.
import type { Country, ExploreData, RateRow } from '../api/types.ts'

export const SOURCE =
  'Obesity Learning Explorer mock dataset (illustrative values modelled on public WHO figures)'

export const countries: Country[] = [
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'FRA', name: 'France' },
  { code: 'USA', name: 'United States' },
  { code: 'IND', name: 'India' },
  { code: 'JPN', name: 'Japan' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'AUS', name: 'Australia' },
]

const values: [string, number, number][] = [
  ['GBR', 13.4, 26.9],
  ['FRA', 8.9, 17.2],
  ['USA', 19.5, 41.6],
  ['IND', 1.2, 7.4],
  ['JPN', 2.1, 4.9],
  ['BRA', 7.6, 28.1],
  ['NGA', 2.9, 9.8],
  ['AUS', 11.8, 32.3],
]

export const rates: RateRow[] = values.flatMap(
  ([countryCode, r1990, r2022]) => [
    { countryCode, year: 1990, ratePercent: r1990, source: SOURCE },
    { countryCode, year: 2022, ratePercent: r2022, source: SOURCE },
  ],
)

export function fetchExploreData(): Promise<ExploreData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ countries, rates }), 100)
  })
}
