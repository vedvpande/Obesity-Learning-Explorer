import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AuthProvider from '../auth/AuthProvider.tsx'
import { DEMO_USER } from '../auth/auth.ts'
import { getSavedFacts, resetSavedFacts } from '../mocks/savedFacts.ts'
import SaveFactForm from './SaveFactForm.tsx'

const country = { code: 'GBR', name: 'United Kingdom' }
const row = {
  countryCode: 'GBR',
  year: 2022,
  ratePercent: 26.9,
  source: 'Mock source',
}

function renderForm({ signedIn }: { signedIn: boolean }) {
  if (signedIn) localStorage.setItem('demoSignedIn', 'yes')
  render(
    <MemoryRouter>
      <AuthProvider>
        <SaveFactForm country={country} row={row} />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  resetSavedFacts()
})

test('signed out: invites sign-in instead of showing the form', () => {
  renderForm({ signedIn: false })
  expect(
    screen.getByText('Sign in to save this fact to My Report.'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Save to My Report' }),
  ).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Sign in (demo)' }))
  expect(
    screen.getByRole('button', { name: 'Save to My Report' }),
  ).toBeInTheDocument()
})

test('signed in: labelled note with hint and character counter', () => {
  renderForm({ signedIn: true })
  const note = screen.getByLabelText('Note (optional)')
  expect(note).toHaveAttribute('maxLength', '280')
  expect(note).toHaveAccessibleDescription(
    "Don't include personal health information. 0/280",
  )
  fireEvent.change(note, { target: { value: 'Use in intro' } })
  expect(screen.getByText('12/280')).toBeInTheDocument()
})

test('saves the current fact with its note', async () => {
  renderForm({ signedIn: true })
  fireEvent.change(screen.getByLabelText('Note (optional)'), {
    target: { value: 'Use in intro' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save to My Report' }))

  expect(await screen.findByText(/Saved to My Report\./)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View My Report' })).toHaveAttribute(
    'href',
    '/my-report',
  )
  expect(screen.getByLabelText('Note (optional)')).toHaveValue('')
  expect(await getSavedFacts(DEMO_USER)).toMatchObject([
    {
      countryCode: 'GBR',
      countryName: 'United Kingdom',
      year: 2022,
      ratePercent: 26.9,
      source: 'Mock source',
      note: 'Use in intro',
    },
  ])
})

test('saves without a note', async () => {
  renderForm({ signedIn: true })
  fireEvent.click(screen.getByRole('button', { name: 'Save to My Report' }))
  expect(await screen.findByText(/Saved to My Report\./)).toBeInTheDocument()
  expect(await getSavedFacts(DEMO_USER)).toMatchObject([{ note: '' }])
})
