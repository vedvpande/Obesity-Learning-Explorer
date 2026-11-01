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

test('renders the explore page at /explore', async () => {
  render(
    <MemoryRouter initialEntries={['/explore']}>
      <App />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', { level: 1, name: 'Look up a country' }),
  ).toBeInTheDocument()
  expect(await screen.findByLabelText('Country')).toBeInTheDocument()
})
