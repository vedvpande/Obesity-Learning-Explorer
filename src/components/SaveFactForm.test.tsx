import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ApiError, createSavedFact } from '../api/client.ts'
import { authValue } from '../test/authState.ts'
import WithAuth from '../test/WithAuth.tsx'
import SaveFactForm from './SaveFactForm.tsx'

vi.mock('../api/client.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client.ts')>()
  return { ...actual, createSavedFact: vi.fn() }
})

const country = { code: 'GBR', name: 'United Kingdom' }
const row = {
  countryCode: 'GBR',
  year: 2022,
  ratePercent: 26.9,
  source: 'Test source',
}

function renderForm({ signedIn }: { signedIn: boolean }) {
  render(
    <MemoryRouter initialEntries={['/explore?country=GBR']}>
      <WithAuth value={authValue(signedIn ? 'signedIn' : 'signedOut')}>
        <SaveFactForm country={country} row={row} />
      </WithAuth>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(createSavedFact).mockReset()
  vi.mocked(createSavedFact).mockResolvedValue({
    id: 'new-id',
    countryCode: 'GBR',
    countryName: 'United Kingdom',
    year: 2022,
    ratePercent: 26.9,
    source: 'Test source',
    note: '',
    createdAt: '2026-11-21T10:00:00Z',
  })
})

test('signed out: links to the login page and comes back to this fact', () => {
  renderForm({ signedIn: false })
  expect(
    screen.getByText('Sign in to save this fact to My Report.'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Save to My Report' }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Sign in to save' })).toHaveAttribute(
    'href',
    '/login?next=%2Fexplore%3Fcountry%3DGBR',
  )
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

test('sends only the country, year and note (the server adds rate and source)', async () => {
  renderForm({ signedIn: true })
  fireEvent.change(screen.getByLabelText('Note (optional)'), {
    target: { value: 'Use in intro' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save to My Report' }))

  expect(await screen.findByText(/Saved to My Report\./)).toBeInTheDocument()
  expect(createSavedFact).toHaveBeenCalledWith({
    countryCode: 'GBR',
    year: 2022,
    note: 'Use in intro',
  })
  expect(screen.getByRole('link', { name: 'View My Report' })).toHaveAttribute(
    'href',
    '/my-report',
  )
  expect(screen.getByLabelText('Note (optional)')).toHaveValue('')
})

test('saves without a note', async () => {
  renderForm({ signedIn: true })
  fireEvent.click(screen.getByRole('button', { name: 'Save to My Report' }))
  expect(await screen.findByText(/Saved to My Report\./)).toBeInTheDocument()
  expect(createSavedFact).toHaveBeenCalledWith(
    expect.objectContaining({ note: '' }),
  )
})

test("shows the server's message when saving fails", async () => {
  vi.mocked(createSavedFact).mockRejectedValueOnce(
    new ApiError(400, 'Note must be 280 characters or fewer'),
  )
  renderForm({ signedIn: true })
  fireEvent.click(screen.getByRole('button', { name: 'Save to My Report' }))
  expect(
    await screen.findByText(
      "Couldn't save: Note must be 280 characters or fewer",
    ),
  ).toBeInTheDocument()
})
