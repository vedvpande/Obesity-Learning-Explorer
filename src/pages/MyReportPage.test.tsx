import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AuthProvider from '../auth/AuthProvider.tsx'
import { DEMO_USER } from '../auth/auth.ts'
import {
  getSavedFacts,
  resetSavedFacts,
  saveFact,
} from '../mocks/savedFacts.ts'
import MyReportPage from './MyReportPage.tsx'

function renderPage({ signedIn = true } = {}) {
  if (signedIn) localStorage.setItem('demoSignedIn', 'yes')
  render(
    <MemoryRouter>
      <AuthProvider>
        <MyReportPage />
      </AuthProvider>
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

async function seed() {
  await saveFact(DEMO_USER, {
    countryCode: 'GBR',
    countryName: 'United Kingdom',
    year: 2022,
    ratePercent: 26.9,
    source: 'Mock source',
    note: 'Use in intro',
  })
  await saveFact(DEMO_USER, {
    countryCode: 'FRA',
    countryName: 'France',
    year: 2022,
    ratePercent: 17.2,
    source: 'Mock source',
    note: '',
  })
  // Another account's fact must never show up.
  await saveFact(
    { id: 'someone-else', name: 'Sam' },
    {
      countryCode: 'USA',
      countryName: 'United States',
      year: 2022,
      ratePercent: 41.6,
      source: 'Mock source',
      note: '',
    },
  )
}

beforeEach(() => {
  localStorage.clear()
  resetSavedFacts()
})

test('signed out: asks to sign in and shows no facts', () => {
  renderPage({ signedIn: false })
  expect(
    screen.getByRole('heading', { level: 1, name: 'My Report' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Sign in to see the facts you have saved.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('signed in with nothing saved: shows an empty message', async () => {
  renderPage()
  expect(
    await screen.findByText(/You haven't saved any facts yet/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Look up a country' }),
  ).toHaveAttribute('href', '/explore')
})

test("lists only this user's facts, newest first, with notes", async () => {
  await seed()
  renderPage()
  const items = await screen.findAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('France, 2022: 17.2%')
  expect(items[1]).toHaveTextContent('United Kingdom, 2022: 26.9%')
  expect(items[1]).toHaveTextContent('Note: Use in intro')
  expect(screen.queryByText(/United States/)).not.toBeInTheDocument()
})

test('Delete removes the fact and announces it', async () => {
  await seed()
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Delete France, 2022' }),
  )
  expect(await screen.findByText('Deleted France, 2022.')).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  expect(await getSavedFacts(DEMO_USER)).toHaveLength(1)
})

test('Copy all citations copies one citation per line', async () => {
  await seed()
  const writeText = mockClipboard(() => Promise.resolve())
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Copy all citations' }),
  )
  expect(await screen.findByText('Copied 2 citations.')).toBeInTheDocument()
  expect(writeText).toHaveBeenCalledWith(
    [
      'France, 2022: 17.2% of adults (18+) had obesity. Source: Mock source.',
      'United Kingdom, 2022: 26.9% of adults (18+) had obesity. Source: Mock source.',
    ].join('\n'),
  )
})

test('shows a message when copying fails', async () => {
  await seed()
  mockClipboard(() => Promise.reject(new Error('denied')))
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Copy all citations' }),
  )
  expect(
    await screen.findByText(
      "Couldn't copy. Select the citations and copy them yourself.",
    ),
  ).toBeInTheDocument()
})

test('each Delete button names its fact for screen readers', async () => {
  await seed()
  renderPage()
  const list = await screen.findByRole('list')
  expect(
    within(list)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label')),
  ).toEqual(['Delete France, 2022', 'Delete United Kingdom, 2022'])
})
