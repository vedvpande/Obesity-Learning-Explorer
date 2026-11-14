import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import LandingPage from './LandingPage.tsx'

test('renders the app name', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Obesity Learning Explorer',
    }),
  ).toBeInTheDocument()
})
