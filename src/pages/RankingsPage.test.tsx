import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import * as mocks from '../mocks/countries.ts'
import RankingsPage from './RankingsPage.tsx'

vi.mock('../mocks/countries.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mocks/countries.ts')>()
  return { ...actual, fetchExploreData: vi.fn(actual.fetchExploreData) }
})

function renderPage() {
  render(
    <MemoryRouter>
      <RankingsPage />
    </MemoryRouter>,
  )
}

async function table() {
  return screen.findByRole('table')
}

// The first cell of each body row is the country name.
function countryOrder() {
  const [, ...bodyRows] = screen.getAllByRole('row')
  return bodyRows.map(
    (r) => within(r).getAllByRole('rowheader')[0]?.textContent,
  )
}

function headerButton(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name}`) })
}

function header(name: string) {
  return screen.getByRole('columnheader', { name: new RegExp(`^${name}`) })
}

afterEach(() => {
  vi.mocked(mocks.fetchExploreData).mockClear()
})

test('shows the four columns and a caption with adults, years and source', async () => {
  renderPage()
  const t = await table()
  expect(
    within(t)
      .getAllByRole('columnheader')
      .map((h) => h.textContent?.replace(/[▲▼]/, '')),
  ).toEqual([
    'Country',
    'Rate 1990 (%)',
    'Rate 2022 (%)',
    'Change (percentage points)',
  ])
  const caption = t.querySelector('caption')
  expect(caption).toHaveTextContent('adults (18+)')
  expect(caption).toHaveTextContent('1990 and 2022')
  expect(caption).toHaveTextContent(`Source: ${mocks.SOURCE}.`)
})

test('starts sorted by country A–Z', async () => {
  renderPage()
  await table()
  expect(countryOrder()).toEqual(
    [...mocks.countries].map((c) => c.name).sort((a, b) => a.localeCompare(b)),
  )
  expect(header('Country')).toHaveAttribute('aria-sort', 'ascending')
})

test.each([
  ['Rate 1990', 'India', 'United States'],
  ['Rate 2022', 'Japan', 'United States'],
  ['Change', 'Japan', 'United States'],
])(
  'sorting by %s: first click ascending, second click descending',
  async (column, lowest, highest) => {
    renderPage()
    await table()

    fireEvent.click(headerButton(column))
    expect(countryOrder()[0]).toBe(lowest)
    expect(countryOrder().at(-1)).toBe(highest)
    expect(header(column)).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(headerButton(column))
    expect(countryOrder()[0]).toBe(highest)
    expect(countryOrder().at(-1)).toBe(lowest)
    expect(header(column)).toHaveAttribute('aria-sort', 'descending')
  },
)

test('clicking Country again reverses to Z–A', async () => {
  renderPage()
  await table()
  fireEvent.click(headerButton('Country'))
  expect(countryOrder()[0]).toBe('United States')
  expect(header('Country')).toHaveAttribute('aria-sort', 'descending')
})

test('only the sorted column has aria-sort', async () => {
  renderPage()
  await table()
  fireEvent.click(headerButton('Change'))
  const withSort = screen
    .getAllByRole('columnheader')
    .filter((h) => h.hasAttribute('aria-sort'))
  expect(withSort).toEqual([header('Change')])
})

test('sort controls are real buttons, so Enter and Space work', async () => {
  renderPage()
  const t = await table()
  const buttons = within(t).getAllByRole('button')
  expect(buttons).toHaveLength(4)
  for (const b of buttons) {
    expect(b.tagName).toBe('BUTTON')
    expect(b).toHaveAttribute('type', 'button')
  }
})

test('each country name links to its Explore page', async () => {
  renderPage()
  await table()
  for (const c of mocks.countries) {
    expect(screen.getByRole('link', { name: c.name })).toHaveAttribute(
      'href',
      `/explore?country=${c.code}`,
    )
  }
})

test.each([
  ['United Kingdom', '13.4', '26.9', '+13.5'],
  ['France', '8.9', '17.2', '+8.3'],
  ['United States', '19.5', '41.6', '+22.1'],
  ['Japan', '2.1', '4.9', '+2.8'],
  ['Nigeria', '2.9', '9.8', '+6.9'],
])('%s values match the data', async (name, r1990, r2022, change) => {
  renderPage()
  await table()
  const row = screen.getByRole('link', { name }).closest('tr')!
  expect(
    within(row)
      .getAllByRole('cell')
      .map((c) => c.textContent),
  ).toEqual([r1990, r2022, change])
})

test('the table scrolls inside its own keyboard-reachable box', async () => {
  renderPage()
  const t = await table()
  const region = screen.getByRole('region', { name: /Share of adults/ })
  expect(region).toContainElement(t)
  expect(region).toHaveClass('overflow-x-auto')
  expect(region).toHaveAttribute('tabIndex', '0')
})

test('shows an error state and recovers with Try again', async () => {
  vi.mocked(mocks.fetchExploreData).mockRejectedValueOnce(new Error('down'))
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load data. Try again.",
  )
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await table()).toBeInTheDocument()
})
