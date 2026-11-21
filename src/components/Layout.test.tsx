import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { fetchMe, signOut } from '../api/client.ts'
import App from '../App.tsx'

// The app asks GET /api/auth/me who is signed in; tests answer for it.
vi.mock('../api/client.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client.ts')>()
  const testData = await import('../mocks/countries.ts')
  return {
    ...actual,
    fetchExploreData: vi.fn(testData.fetchExploreData),
    fetchMe: vi.fn(),
    signOut: vi.fn(),
    listSavedFacts: vi.fn(() => Promise.resolve([])),
  }
})

const ANN = { name: 'Ann', email: 'ann@example.com' }

beforeEach(() => {
  vi.mocked(fetchMe).mockReset().mockResolvedValue(ANN)
  vi.mocked(signOut).mockReset().mockResolvedValue(undefined)
})

const DISCLAIMER =
  'For learning only. This site does not diagnose or give medical advice.'
const EMERGENCY = 'In an emergency, call your local emergency number.'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  )
}

const pages = [
  ['/', 'Obesity Learning Explorer', 'Home'],
  ['/explore', 'Look up a country', 'Explore'],
  ['/rankings', 'Rankings', 'Rankings'],
  ['/learn', 'Learn', 'Learn'],
  ['/about', 'About Obesity Learning Explorer', 'About'],
  ['/my-report', 'My Report', 'My Report'],
] as const

// My Report needs sign-in; every other page is public.
const publicPages = pages.filter(([url]) => url !== '/my-report')

test.each(pages)(
  '%s renders its heading inside the shared layout',
  async (url, heading) => {
    renderAt(url)
    const main = screen.getByRole('main')
    expect(
      await within(main).findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('contentinfo')).getByText(DISCLAIMER),
    ).toBeInTheDocument()
  },
)

test.each(pages)('%s footer tells people what to do in an emergency', (url) => {
  renderAt(url)
  expect(
    within(screen.getByRole('contentinfo')).getByText(EMERGENCY),
  ).toBeInTheDocument()
})

test.each(pages)(
  '%s marks only its own nav link as the current page',
  (url, _heading, label) => {
    renderAt(url)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(current.map((link) => link.textContent)).toEqual([label])
  },
)

test('an unknown URL shows Page not found with a link home', () => {
  renderAt('/no-such-page')
  expect(
    screen.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Go to the home page' }),
  ).toHaveAttribute('href', '/')
  expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
})

test('"Skip to main content" is the first thing Tab reaches', () => {
  const { container } = renderAt('/')
  const first = container.querySelector('a[href], button, select, input')
  expect(first).toHaveTextContent('Skip to main content')
  expect(first).toHaveAttribute('href', '#main')
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
})

test.each(publicPages)(
  '%s works signed out: no sign-in gate or redirect',
  async (url, heading) => {
    vi.mocked(fetchMe).mockResolvedValue(null)
    renderAt(url)
    expect(
      await screen.findByRole('link', { name: 'Sign in' }),
    ).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    // Signing in is optional (header button), never required to see the page.
    expect(
      within(main).queryByText(/sign in to (see|continue)/i),
    ).not.toBeInTheDocument()
  },
)

test('signed out: the header links to the login page and back to this page', async () => {
  vi.mocked(fetchMe).mockResolvedValue(null)
  renderAt('/explore?country=GBR')
  expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    '/login?next=%2Fexplore%3Fcountry%3DGBR',
  )
  expect(screen.queryByText(/demo/i)).not.toBeInTheDocument()
})

test('signed in: the header shows my name and Sign out works', async () => {
  renderAt('/')
  expect(await screen.findByText('Ann')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(
    await screen.findByRole('link', { name: 'Sign in' }),
  ).toBeInTheDocument()
  expect(signOut).toHaveBeenCalledTimes(1)
})

test('signed out: /my-report redirects to the login page', async () => {
  vi.mocked(fetchMe).mockResolvedValue(null)
  renderAt('/my-report')
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
  ).toBeInTheDocument()
})
