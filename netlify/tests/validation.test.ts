// @vitest-environment node
import {
  createSavedFact,
  firstIssue,
  ratesQuery,
  savedFactId,
  updateSavedFact,
} from '../lib/validation.ts'

const valid = { countryCode: 'GBR', year: 2022, note: 'Use in intro' }

describe('ratesQuery', () => {
  test('accepts a 3-letter capital code', () => {
    expect(ratesQuery.safeParse({ country: 'GBR' }).success).toBe(true)
  })

  test.each([undefined, '', 'gbr', 'GB', 'GBRX', "G'R", "GBR'; DROP TABLE"])(
    'rejects %s',
    (country) => {
      const result = ratesQuery.safeParse({ country })
      expect(result.success).toBe(false)
    },
  )
})

describe('createSavedFact', () => {
  test('accepts a valid fact and trims the note', () => {
    expect(createSavedFact.parse({ ...valid, note: '  hi  ' })).toEqual({
      ...valid,
      note: 'hi',
    })
  })

  test('the note is optional and defaults to empty', () => {
    expect(createSavedFact.parse({ countryCode: 'GBR', year: 2022 })).toEqual({
      countryCode: 'GBR',
      year: 2022,
      note: '',
    })
  })

  test('a 280-character note is allowed, 281 is not', () => {
    expect(
      createSavedFact.safeParse({ ...valid, note: 'a'.repeat(280) }).success,
    ).toBe(true)
    const tooLong = createSavedFact.safeParse({
      ...valid,
      note: 'a'.repeat(281),
    })
    expect(tooLong.success).toBe(false)
    if (!tooLong.success) {
      expect(firstIssue(tooLong.error)).toBe(
        'Note must be 280 characters or fewer',
      )
    }
  })

  test.each([1989, 2023, 2000.5, '2022', Number.NaN, undefined])(
    'rejects the year %s',
    (year) => {
      expect(createSavedFact.safeParse({ ...valid, year }).success).toBe(false)
    },
  )

  test.each(['gbr', 'GB', '', undefined, 123])(
    'rejects the country code %s',
    (countryCode) => {
      expect(createSavedFact.safeParse({ ...valid, countryCode }).success).toBe(
        false,
      )
    },
  )

  test('refuses a rate or source sent by the browser (unknown fields)', () => {
    expect(
      createSavedFact.safeParse({ ...valid, ratePercent: 99 }).success,
    ).toBe(false)
    expect(createSavedFact.safeParse({ ...valid, source: 'Me' }).success).toBe(
      false,
    )
  })

  test.each([null, undefined, 'text', 42, []])(
    'rejects a body that is not an object: %s',
    (body) => {
      expect(createSavedFact.safeParse(body).success).toBe(false)
    },
  )
})

describe('updateSavedFact', () => {
  test('accepts only a note', () => {
    expect(updateSavedFact.parse({ note: 'New note' })).toEqual({
      note: 'New note',
    })
  })

  test('rejects other fields and missing notes', () => {
    expect(updateSavedFact.safeParse({ note: 'x', year: 2000 }).success).toBe(
      false,
    )
    expect(updateSavedFact.safeParse({}).success).toBe(false)
    expect(updateSavedFact.safeParse({ note: 'a'.repeat(281) }).success).toBe(
      false,
    )
  })
})

describe('savedFactId', () => {
  test('accepts a uuid', () => {
    expect(
      savedFactId.safeParse('3f2504e0-4f89-41d3-9a0c-0305e82c3301').success,
    ).toBe(true)
  })

  test.each(['1', 'abc', '', '3f2504e0-4f89-41d3-9a0c'])('rejects %s', (id) => {
    expect(savedFactId.safeParse(id).success).toBe(false)
  })
})
