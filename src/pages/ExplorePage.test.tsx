import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import * as mocks from '../mocks/countries.ts'
import ExplorePage from './ExplorePage.tsx'

vi.mock('../mocks/countries.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mocks/countries.ts')>()
  return { ...actual, fetchExploreData: vi.fn(actual.fetchExploreData) }
})

const { SOURCE } = mocks

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname + location.search}</p>
}

function renderAt(url = '/explore') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/explore" element={<ExplorePage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

function mockClipboard(writeText: (text: string) => Promise<void>) {
  const fn = vi.fn(writeText)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: fn },
    configurable: true,
  })
  return fn
}

afterEach(() => {
  vi.mocked(mocks.fetchExploreData).mockClear()
})

test('shows a loading state, then a labelled Country dropdown in alphabetical order', async () => {
  renderAt()
  expect(screen.getByText('Loading data…')).toBeInTheDocument()

  const select = await screen.findByLabelText('Country')
  const names = within(select)
    .getAllByRole('option')
    .slice(1)
    .map((o) => o.textContent)
  expect(names).toEqual([...names].sort((a, b) => a!.localeCompare(b!)))
  expect(names).toHaveLength(mocks.countries.length)
})

test.each([
  ['GBR', 'United Kingdom', 26.9],
  ['FRA', 'France', 17.2],
  ['USA', 'United States', 41.6],
  ['JPN', 'Japan', 4.9],
  ['NGA', 'Nigeria', 9.8],
])('choosing %s shows the matching fact sentence', async (code, name, rate) => {
  renderAt()
  fireEvent.change(await screen.findByLabelText('Country'), {
    target: { value: code },
  })
  expect(screen.getByTestId('fact')).toHaveTextContent(
    `In 2022, ${rate}% of adults (18+) in ${name} had obesity. Source: ${SOURCE}.`,
  )
})

test('choosing a country updates the URL', async () => {
  renderAt()
  fireEvent.change(await screen.findByLabelText('Country'), {
    target: { value: 'FRA' },
  })
  expect(screen.getByTestId('location')).toHaveTextContent(
    '/explore?country=FRA',
  )
})

test('opening ?country=GBR pre-selects the country', async () => {
  renderAt('/explore?country=GBR')
  expect(await screen.findByLabelText('Country')).toHaveValue('GBR')
  expect(screen.getByTestId('fact')).toHaveTextContent('United Kingdom')
})

test('an unknown country code selects nothing', async () => {
  renderAt('/explore?country=XXX')
  expect(await screen.findByLabelText('Country')).toHaveValue('')
  expect(screen.queryByTestId('fact')).not.toBeInTheDocument()
})

test('Copy this fact copies the sentence and announces "Copied"', async () => {
  const writeText = mockClipboard(() => Promise.resolve())
  renderAt('/explore?country=GBR')
  fireEvent.click(await screen.findByRole('button', { name: 'Copy this fact' }))

  expect(await screen.findByText('Copied')).toHaveAttribute(
    'aria-live',
    'polite',
  )
  const copied = writeText.mock.calls[0]![0]
  expect(copied).toBe(
    `In 2022, 26.9% of adults (18+) in United Kingdom had obesity. Source: ${SOURCE}.`,
  )
})

test('shows a clear message when copying fails', async () => {
  mockClipboard(() => Promise.reject(new Error('denied')))
  renderAt('/explore?country=GBR')
  fireEvent.click(await screen.findByRole('button', { name: 'Copy this fact' }))
  expect(
    await screen.findByText(
      "Couldn't copy. Select the sentence and copy it yourself.",
    ),
  ).toBeInTheDocument()
})

test('shows an error state and recovers with Try again', async () => {
  vi.mocked(mocks.fetchExploreData).mockRejectedValueOnce(new Error('down'))
  renderAt()

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load data. Try again.",
  )
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByLabelText('Country')).toBeInTheDocument()
})

describe('edge cases', () => {
  test('choosing the placeholder clears the fact and removes ?country', async () => {
    renderAt('/explore?country=GBR')
    const select = await screen.findByLabelText('Country')
    expect(screen.getByTestId('fact')).toBeInTheDocument()

    fireEvent.change(select, { target: { value: '' } })
    expect(select).toHaveValue('')
    expect(screen.queryByTestId('fact')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy this fact' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/explore$/)
  })

  test('changing country clears an old "Copied" message', async () => {
    mockClipboard(() => Promise.resolve())
    renderAt('/explore?country=GBR')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy this fact' }),
    )
    expect(await screen.findByText('Copied')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'FRA' },
    })
    expect(screen.queryByText('Copied')).not.toBeInTheDocument()
  })

  test('an empty ?country= param selects nothing and shows no fact', async () => {
    renderAt('/explore?country=')
    expect(await screen.findByLabelText('Country')).toHaveValue('')
    expect(screen.queryByTestId('fact')).not.toBeInTheDocument()
  })

  test('a lowercase code ?country=gbr is not matched (codes are case-sensitive)', async () => {
    renderAt('/explore?country=gbr')
    expect(await screen.findByLabelText('Country')).toHaveValue('')
    expect(screen.queryByTestId('fact')).not.toBeInTheDocument()
  })

  test('an empty countries list shows only the placeholder', async () => {
    vi.mocked(mocks.fetchExploreData).mockResolvedValueOnce({
      countries: [],
      rates: [],
    })
    renderAt('/explore?country=GBR')
    const select = await screen.findByLabelText('Country')
    const options = within(select).getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Choose a country')
    expect(select).toHaveValue('')
    expect(screen.queryByTestId('fact')).not.toBeInTheDocument()
  })

  test('a country with no rate rows shows no fact and no copy button', async () => {
    vi.mocked(mocks.fetchExploreData).mockResolvedValueOnce({
      countries: [...mocks.countries, { code: 'ZZZ', name: 'Nodataland' }],
      rates: mocks.rates,
    })
    renderAt('/explore?country=ZZZ')
    expect(await screen.findByLabelText('Country')).toHaveValue('ZZZ')
    expect(screen.queryByTestId('fact')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy this fact' }),
    ).not.toBeInTheDocument()
  })

  test('a very long country name and source are shown and copied in full', async () => {
    const name = 'The Very Long Name Republic of '.repeat(20) + 'Longland'
    const source = 'An extremely long citation. '.repeat(100).trim()
    vi.mocked(mocks.fetchExploreData).mockResolvedValueOnce({
      countries: [{ code: 'LNG', name }],
      rates: [{ countryCode: 'LNG', year: 2022, ratePercent: 12.3, source }],
    })
    const writeText = mockClipboard(() => Promise.resolve())
    renderAt('/explore?country=LNG')

    const expected = `In 2022, 12.3% of adults (18+) in ${name} had obesity. Source: ${source}.`
    expect(await screen.findByTestId('fact')).toHaveTextContent(expected, {
      normalizeWhitespace: false,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Copy this fact' }))
    expect(await screen.findByText('Copied')).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(expected)
  })

  test('shows the failure message when navigator.clipboard is missing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })
    renderAt('/explore?country=GBR')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy this fact' }),
    )
    expect(
      await screen.findByText(
        "Couldn't copy. Select the sentence and copy it yourself.",
      ),
    ).toBeInTheDocument()
  })

  test('Try again still works after a second failure', async () => {
    vi.mocked(mocks.fetchExploreData)
      .mockRejectedValueOnce(new Error('down'))
      .mockRejectedValueOnce(new Error('still down'))
    renderAt('/explore?country=GBR')

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(mocks.fetchExploreData).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load data. Try again.",
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Country')).toHaveValue('GBR')
    expect(screen.getByTestId('fact')).toHaveTextContent('United Kingdom')
    expect(mocks.fetchExploreData).toHaveBeenCalledTimes(3)
  })
})
