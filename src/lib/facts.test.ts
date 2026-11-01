import type { Country, RateRow } from '../mocks/countries.ts'
import { buildFactSentence, latestRate } from './facts.ts'

const uk: Country = { code: 'GBR', name: 'United Kingdom' }

function row(overrides: Partial<RateRow> = {}): RateRow {
  return {
    countryCode: 'GBR',
    year: 2022,
    ratePercent: 26.9,
    source: 'Test source',
    ...overrides,
  }
}

describe('latestRate', () => {
  test('returns undefined when there are no rows at all', () => {
    expect(latestRate([], 'GBR')).toBeUndefined()
  })

  test('returns undefined when no row matches the country code', () => {
    expect(latestRate([row({ countryCode: 'FRA' })], 'GBR')).toBeUndefined()
  })

  test('returns undefined for an empty country code', () => {
    expect(latestRate([row()], '')).toBeUndefined()
  })

  test('matches country codes case-sensitively (gbr does not match GBR)', () => {
    expect(latestRate([row()], 'gbr')).toBeUndefined()
  })

  test('picks the highest year even when rows are out of order', () => {
    const rows = [
      row({ year: 2010, ratePercent: 20 }),
      row({ year: 2022, ratePercent: 26.9 }),
      row({ year: 1990, ratePercent: 13.4 }),
      row({ year: 2016, ratePercent: 24 }),
    ]
    expect(latestRate(rows, 'GBR')).toEqual(
      row({ year: 2022, ratePercent: 26.9 }),
    )
  })

  test('ignores later years that belong to other countries', () => {
    const rows = [
      row({ year: 2022, ratePercent: 26.9 }),
      row({ countryCode: 'FRA', year: 2030, ratePercent: 99 }),
    ]
    expect(latestRate(rows, 'GBR')?.ratePercent).toBe(26.9)
  })

  test('with duplicate latest years, keeps the first row it saw', () => {
    const rows = [
      row({ year: 2022, ratePercent: 26.9, source: 'first' }),
      row({ year: 2022, ratePercent: 30, source: 'second' }),
    ]
    expect(latestRate(rows, 'GBR')?.source).toBe('first')
  })

  test('a row with a NaN year never wins over a real year', () => {
    const rows = [
      row({ year: 2022 }),
      row({ year: Number.NaN, ratePercent: 1 }),
    ]
    expect(latestRate(rows, 'GBR')?.year).toBe(2022)
  })

  test('a NaN year listed first is kept, because NaN comparisons are always false', () => {
    // Current behaviour: the first row seeds the reduce and nothing is "> NaN".
    const rows = [
      row({ year: Number.NaN, ratePercent: 1 }),
      row({ year: 2022 }),
    ]
    expect(latestRate(rows, 'GBR')?.year).toBeNaN()
  })
})

describe('buildFactSentence', () => {
  test('builds the exact acceptance-criteria sentence', () => {
    expect(buildFactSentence(uk, row())).toBe(
      'In 2022, 26.9% of adults (18+) in United Kingdom had obesity. Source: Test source.',
    )
  })

  test('keeps two decimal places as given (26.95)', () => {
    expect(buildFactSentence(uk, row({ ratePercent: 26.95 }))).toContain(
      '26.95% of adults',
    )
  })

  test('shows a whole number without a trailing .0 (27.0 -> 27)', () => {
    expect(buildFactSentence(uk, row({ ratePercent: 27.0 }))).toContain(
      'In 2022, 27% of adults',
    )
  })

  test('shows 0 as "0%"', () => {
    expect(buildFactSentence(uk, row({ ratePercent: 0 }))).toContain(
      'In 2022, 0% of adults',
    )
  })

  test('does not round floating point noise (current behaviour)', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in JS; the sentence prints it raw.
    expect(buildFactSentence(uk, row({ ratePercent: 0.1 + 0.2 }))).toContain(
      '0.30000000000000004% of adults',
    )
  })

  // The cases below describe CURRENT behaviour. None of these values is a
  // valid percentage, and the sentence prints them as-is. See QA report.
  test('NaN rate is printed as "NaN%" (current behaviour, not acceptable)', () => {
    expect(buildFactSentence(uk, row({ ratePercent: Number.NaN }))).toContain(
      'NaN% of adults',
    )
  })

  test('negative rate is printed as-is (current behaviour, not acceptable)', () => {
    expect(buildFactSentence(uk, row({ ratePercent: -5 }))).toContain(
      '-5% of adults',
    )
  })

  test('Infinity rate is printed as "Infinity%" (current behaviour, not acceptable)', () => {
    expect(
      buildFactSentence(uk, row({ ratePercent: Number.POSITIVE_INFINITY })),
    ).toContain('Infinity% of adults')
  })

  test('rate above 100 is printed as-is (current behaviour, not acceptable)', () => {
    expect(buildFactSentence(uk, row({ ratePercent: 150 }))).toContain(
      '150% of adults',
    )
  })

  test('includes a very long country name and source in full', () => {
    const name = 'Republic of '.repeat(50) + 'Longland'
    const source = 'S'.repeat(2000)
    const sentence = buildFactSentence(
      { code: 'LNG', name },
      row({ countryCode: 'LNG', source }),
    )
    expect(sentence).toBe(
      `In 2022, 26.9% of adults (18+) in ${name} had obesity. Source: ${source}.`,
    )
  })

  test('a source that already ends in a full stop gets a second one (current behaviour)', () => {
    expect(buildFactSentence(uk, row({ source: 'WHO.' }))).toMatch(
      /Source: WHO\.\.$/,
    )
  })
})
