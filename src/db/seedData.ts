// Turns data/obesity_countries.csv (country,code,year,rate) into rows for
// the countries and obesity_rates tables. Pure functions so they can be tested.

export const OWID_SOURCE = 'Our World in Data, "Obesity in adults" (WHO data)'

export type SeedCountry = { code: string; name: string }
export type SeedRate = {
  countryCode: string
  year: number
  ratePercent: number
}
export type ParsedRates = {
  countries: SeedCountry[]
  rates: SeedRate[]
  skipped: number
}

// Splits one CSV line, allowing quoted fields that contain commas or "".
export function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(field)
      field = ''
    } else {
      field += ch
    }
  }
  fields.push(field)
  return fields
}

// Keeps real countries only (3 capital letters, so "World" or "OWID_WRL"
// regions are skipped), years 1990-2022 and rates from 0 to 100.
export function parseRatesCsv(text: string): ParsedRates {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  const header = splitCsvLine(lines[0] ?? '').map((h) => h.trim())
  const col = (name: string) => header.indexOf(name)
  const [iCountry, iCode, iYear, iRate] = [
    'country',
    'code',
    'year',
    'rate',
  ].map(col)
  if ([iCountry, iCode, iYear, iRate].some((i) => i === undefined || i < 0)) {
    throw new Error('CSV must have the columns country,code,year,rate')
  }

  const countries = new Map<string, string>()
  const rates = new Map<string, SeedRate>()
  let skipped = 0

  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line)
    const name = fields[iCountry as number]?.trim() ?? ''
    const code = fields[iCode as number]?.trim() ?? ''
    const year = Number(fields[iYear as number])
    const ratePercent = Number(fields[iRate as number])

    const valid =
      name !== '' &&
      /^[A-Z]{3}$/.test(code) &&
      Number.isInteger(year) &&
      year >= 1990 &&
      year <= 2022 &&
      fields[iRate as number]?.trim() !== '' &&
      Number.isFinite(ratePercent) &&
      ratePercent >= 0 &&
      ratePercent <= 100
    if (!valid) {
      skipped++
      continue
    }

    if (!countries.has(code)) countries.set(code, name)
    rates.set(`${code}-${year}`, { countryCode: code, year, ratePercent })
  }

  return {
    countries: [...countries].map(([code, name]) => ({ code, name })),
    rates: [...rates.values()],
    skipped,
  }
}
