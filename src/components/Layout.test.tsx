import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'

afterEach(() => {
  localStorage.clear()
})

const DISCLAIMER =
  'For learning only. This site does not diagnose or give medical advice.'

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
  (url, heading) => {
    renderAt(url)
    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('contentinfo')).getByText(DISCLAIMER),
    ).toBeInTheDocument()
  },
)

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
  (url, heading) => {
    renderAt(url)
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

test('header offers an optional sign-in that toggles to Sign out', () => {
  renderAt('/')
  const button = screen.getByRole('button', { name: 'Sign in (demo)' })
  fireEvent.click(button)
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(
    screen.getByRole('button', { name: 'Sign in (demo)' }),
  ).toBeInTheDocument()
})
