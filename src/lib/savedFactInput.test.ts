import { NOTE_MAX_LENGTH, validateSavedFactInput } from './savedFactInput.ts'

const valid = {
  countryCode: 'GBR',
  countryName: 'United Kingdom',
  year: 2022,
  ratePercent: 26.9,
  source: 'Mock source',
  note: 'Use in intro',
}

function errorFor(input: unknown) {
  const result = validateSavedFactInput(input)
  return result.ok ? null : result.error
}

test('accepts a valid fact and trims text', () => {
  const result = validateSavedFactInput({ ...valid, note: '  hi  ' })
  expect(result).toEqual({ ok: true, value: { ...valid, note: 'hi' } })
})

test('the note is optional', () => {
  expect(validateSavedFactInput({ ...valid, note: undefined }).ok).toBe(true)
})

test(`a note of exactly ${NOTE_MAX_LENGTH} characters is allowed`, () => {
  expect(errorFor({ ...valid, note: 'a'.repeat(NOTE_MAX_LENGTH) })).toBeNull()
})

test('rejects a note that is too long', () => {
  expect(errorFor({ ...valid, note: 'a'.repeat(NOTE_MAX_LENGTH + 1) })).toBe(
    'Note must be 280 characters or fewer.',
  )
})

test.each([1989, 2023, 2000.5, '2022', Number.NaN, undefined])(
  'rejects a bad year: %s',
  (year) => {
    expect(errorFor({ ...valid, year })).toMatch(/^Year must be/)
  },
)

test.each([-1, 101, Number.NaN, Infinity, '26.9', undefined])(
  'rejects a bad rate: %s',
  (ratePercent) => {
    expect(errorFor({ ...valid, ratePercent })).toMatch(/^Rate must be/)
  },
)

test.each(['gbr', 'GB', 'GBRX', "G'R", '', undefined])(
  'rejects a bad country code: %s',
  (countryCode) => {
    expect(errorFor({ ...valid, countryCode })).toMatch(/^Country code/)
  },
)

test('rejects missing or blank required text', () => {
  expect(errorFor({ ...valid, countryName: '  ' })).toBe(
    'Country name is required.',
  )
  expect(errorFor({ ...valid, source: undefined })).toBe('Source is required.')
})

test.each([null, undefined, 'text', 42, []])(
  'rejects input that is not an object: %s',
  (input) => {
    expect(errorFor(input)).not.toBeNull()
  },
)
