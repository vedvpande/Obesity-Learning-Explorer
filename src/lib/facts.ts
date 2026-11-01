import type { Country, RateRow } from '../mocks/countries.ts'

export function latestRate(rates: RateRow[], countryCode: string) {
  return rates
    .filter((row) => row.countryCode === countryCode)
    .reduce<RateRow | undefined>(
      (latest, row) => (!latest || row.year > latest.year ? row : latest),
      undefined,
    )
}

// Used for both the on-screen fact and the copied text so they never differ.
export function buildFactSentence(country: Country, row: RateRow) {
  return `In ${row.year}, ${row.ratePercent}% of adults (18+) in ${country.name} had obesity. Source: ${row.source}.`
}
