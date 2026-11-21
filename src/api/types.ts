// Shapes of the data the API sends to the browser.

export type Country = {
  code: string
  name: string
}

export type RateRow = {
  countryCode: string
  year: number
  ratePercent: number
  source: string
}

export type ExploreData = {
  countries: Country[]
  rates: RateRow[]
}

export type SavedFact = {
  id: string
  countryCode: string
  countryName: string
  year: number
  ratePercent: number
  source: string
  note: string
  createdAt: string
}

export type NewSavedFact = {
  countryCode: string
  year: number
  note: string
}
