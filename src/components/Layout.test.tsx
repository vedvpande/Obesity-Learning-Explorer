import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'

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
] as const

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

test.each(pages)('%s does not ask the user to sign in', (url) => {
  renderAt(url)
  expect(screen.queryByText(/sign in|log in/i)).not.toBeInTheDocument()
})
