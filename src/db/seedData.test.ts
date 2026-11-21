import { parseRatesCsv, splitCsvLine } from './seedData.ts'

const header = 'country,code,year,rate'

test('splits plain and quoted CSV fields', () => {
  expect(splitCsvLine('Japan,JPN,1990,2.1')).toEqual([
    'Japan',
    'JPN',
    '1990',
    '2.1',
  ])
  expect(splitCsvLine('"Korea, Republic of",KOR,1990,1.5')).toEqual([
    'Korea, Republic of',
    'KOR',
    '1990',
    '1.5',
  ])
  expect(splitCsvLine('"Say ""hi""",AAA,1990,1')[0]).toBe('Say "hi"')
})

test('keeps valid country rows with exact rates', () => {
  const result = parseRatesCsv(
    [header, 'Afghanistan,AFG,1990,2.0304005', 'Afghanistan,AFG,2022,5.5'].join(
      '\n',
    ),
  )
  expect(result.countries).toEqual([{ code: 'AFG', name: 'Afghanistan' }])
  expect(result.rates).toEqual([
    { countryCode: 'AFG', year: 1990, ratePercent: 2.0304005 },
    { countryCode: 'AFG', year: 2022, ratePercent: 5.5 },
  ])
  expect(result.skipped).toBe(0)
})

test.each([
  ['a region with no code', 'World,,1990,13.1'],
  ['a region with an OWID code', 'World,OWID_WRL,1990,13.1'],
  ['a lowercase code', 'Japan,jpn,1990,2.1'],
  ['a year before 1990', 'Japan,JPN,1975,1.2'],
  ['a year after 2022', 'Japan,JPN,2023,5.0'],
  ['a decimal year', 'Japan,JPN,1990.5,2.1'],
  ['a negative rate', 'Japan,JPN,1990,-1'],
  ['a rate over 100', 'Japan,JPN,1990,101'],
  ['a missing rate', 'Japan,JPN,1990,'],
  ['a rate that is not a number', 'Japan,JPN,1990,abc'],
  ['a missing name', ',JPN,1990,2.1'],
])('skips %s', (_label, row) => {
  const result = parseRatesCsv([header, row].join('\n'))
  expect(result.rates).toEqual([])
  expect(result.countries).toEqual([])
  expect(result.skipped).toBe(1)
})

test('a repeated country-year keeps the last value (no duplicates)', () => {
  const result = parseRatesCsv(
    [header, 'Japan,JPN,1990,2.1', 'Japan,JPN,1990,2.2'].join('\n'),
  )
  expect(result.rates).toEqual([
    { countryCode: 'JPN', year: 1990, ratePercent: 2.2 },
  ])
})

test('ignores blank lines and Windows line endings', () => {
  const result = parseRatesCsv(`${header}\r\nJapan,JPN,1990,2.1\r\n\r\n`)
  expect(result.rates).toHaveLength(1)
})

test('rejects a file without the expected columns', () => {
  expect(() => parseRatesCsv('name,year\nJapan,1990')).toThrow(
    'CSV must have the columns country,code,year,rate',
  )
})
