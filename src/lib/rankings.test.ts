import type { RateRow } from '../mocks/countries.ts'
import {
  buildRankingRows,
  formatChange,
  formatRate,
  sortRows,
  type RankingRow,
} from './rankings.ts'

const rate = (countryCode: string, year: number, ratePercent: number) =>
  ({ countryCode, year, ratePercent, source: 'S' }) satisfies RateRow

test('builds rows with 1990, 2022 and the change between them', () => {
  const rows = buildRankingRows(
    [{ code: 'GBR', name: 'United Kingdom' }],
    [rate('GBR', 1990, 13.4), rate('GBR', 2022, 26.9)],
  )
  expect(rows).toEqual([
    {
      code: 'GBR',
      name: 'United Kingdom',
      rate1990: 13.4,
      rate2022: 26.9,
      change: 13.5,
    },
  ])
})

test('rounds the change to 1 decimal (no floating-point noise)', () => {
  const [row] = buildRankingRows(
    [{ code: 'AAA', name: 'A' }],
    [rate('AAA', 1990, 0.1), rate('AAA', 2022, 0.4)],
  )
  expect(row?.change).toBe(0.3)
})

test('a missing year, or a value that is not a number, becomes no data', () => {
  const rows = buildRankingRows(
    [
      { code: 'AAA', name: 'A' },
      { code: 'BBB', name: 'B' },
    ],
    [
      rate('AAA', 2022, 10),
      rate('BBB', 1990, Number.NaN),
      rate('BBB', 2022, 5),
    ],
  )
  expect(rows[0]).toMatchObject({ rate1990: undefined, change: undefined })
  expect(rows[1]).toMatchObject({ rate1990: undefined, rate2022: 5 })
})

const rows: RankingRow[] = [
  { code: 'B', name: 'Brazil', rate1990: 7.6, rate2022: 28.1, change: 20.5 },
  { code: 'J', name: 'Japan', rate1990: 2.1, rate2022: 4.9, change: 2.8 },
  {
    code: 'X',
    name: 'Atlantis',
    rate1990: undefined,
    rate2022: 9,
    change: undefined,
  },
  { code: 'F', name: 'France', rate1990: 8.9, rate2022: 17.2, change: 8.3 },
]

const names = (list: RankingRow[]) => list.map((r) => r.name)

test('sorts by name in both directions', () => {
  expect(names(sortRows(rows, 'name', 'ascending'))).toEqual([
    'Atlantis',
    'Brazil',
    'France',
    'Japan',
  ])
  expect(names(sortRows(rows, 'name', 'descending'))).toEqual([
    'Japan',
    'France',
    'Brazil',
    'Atlantis',
  ])
})

test('sorts numbers in both directions, with no data always last', () => {
  expect(names(sortRows(rows, 'change', 'ascending'))).toEqual([
    'Japan',
    'France',
    'Brazil',
    'Atlantis',
  ])
  expect(names(sortRows(rows, 'change', 'descending'))).toEqual([
    'Brazil',
    'France',
    'Japan',
    'Atlantis',
  ])
})

test('does not change the original array', () => {
  const before = names(rows)
  sortRows(rows, 'rate2022', 'descending')
  expect(names(rows)).toEqual(before)
})

test('formats rates and changes', () => {
  expect(formatRate(26.9)).toBe('26.9')
  expect(formatRate(27)).toBe('27.0')
  expect(formatRate(undefined)).toBe('No data')
  expect(formatChange(13.5)).toBe('+13.5')
  expect(formatChange(-2)).toBe('−2.0')
  expect(formatChange(0)).toBe('0.0')
  expect(formatChange(undefined)).toBe('No data')
})
