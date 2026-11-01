import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import AboutPage from './AboutPage.tsx'

function renderPage() {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  )
}

test('renders the About heading', () => {
  renderPage()
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'About Obesity Learning Explorer',
    }),
  ).toBeInTheDocument()
})

test('explains what the app is and that it is a learning project', () => {
  renderPage()
  expect(
    screen.getByRole('heading', { name: 'What this app is' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'A learning project' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/built as a learning project/)).toBeInTheDocument()
})

test('describes My Report and that it saves no health information', () => {
  renderPage()
  expect(screen.getByRole('heading', { name: 'My Report' })).toBeInTheDocument()
  expect(
    screen.getByText(/never personal health information/),
  ).toBeInTheDocument()
})

test('shows the disclaimer', () => {
  renderPage()
  expect(
    screen.getByText(
      'For learning only. This site does not diagnose or give medical advice.',
    ),
  ).toBeInTheDocument()
})

test('links back to home', () => {
  renderPage()
  expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
    'href',
    '/',
  )
})

test('is reachable at /about', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <App />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', { name: 'About Obesity Learning Explorer' }),
  ).toBeInTheDocument()
})

test('landing page links to About', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
    'href',
    '/about',
  )
})
