import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App.tsx'

test('renders the home heading', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', { name: 'Obesity Learning Explorer' }),
  ).toBeInTheDocument()
})
