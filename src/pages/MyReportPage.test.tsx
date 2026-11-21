import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import {
  ApiError,
  deleteSavedFact,
  listSavedFacts,
  updateSavedFactNote,
} from '../api/client.ts'
import type { SavedFact } from '../api/types.ts'
import { authValue } from '../test/authState.ts'
import WithAuth from '../test/WithAuth.tsx'
import MyReportPage from './MyReportPage.tsx'

vi.mock('../api/client.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client.ts')>()
  return {
    ...actual,
    listSavedFacts: vi.fn(),
    deleteSavedFact: vi.fn(),
    updateSavedFactNote: vi.fn(),
  }
})

const fact = (
  id: string,
  countryName: string,
  ratePercent: number,
  note: string,
): SavedFact => ({
  id,
  countryCode: countryName.slice(0, 3).toUpperCase(),
  countryName,
  year: 2022,
  ratePercent,
  source: 'Test source',
  note,
  createdAt: '2026-11-21T10:00:00Z',
})

// The server returns newest first; the page shows them in that order.
const facts = [
  fact('f-2', 'France', 17.2, ''),
  fact('f-1', 'United Kingdom', 26.9, 'Use in intro'),
]

// RequireAuth (tested separately) only shows this page when signed in.
function renderPage(auth = authValue('signedIn')) {
  render(
    <MemoryRouter>
      <WithAuth value={auth}>
        <MyReportPage />
      </WithAuth>
    </MemoryRouter>,
  )
  return auth
}

function mockClipboard(writeText: (text: string) => Promise<void>) {
  const fn = vi.fn(writeText)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: fn },
    configurable: true,
  })
  return fn
}

beforeEach(() => {
  vi.mocked(listSavedFacts).mockReset().mockResolvedValue(facts)
  vi.mocked(deleteSavedFact).mockReset().mockResolvedValue(undefined)
  vi.mocked(updateSavedFactNote)
    .mockReset()
    .mockImplementation((id, note) => Promise.resolve({ id, note }))
})

test('if the session has ended (401), it refreshes the sign-in state', async () => {
  vi.mocked(listSavedFacts).mockRejectedValueOnce(
    new ApiError(401, 'Sign in to continue.'),
  )
  const auth = renderPage()
  await waitFor(() => expect(auth.refresh).toHaveBeenCalled())
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('signed in with nothing saved: shows an empty message', async () => {
  vi.mocked(listSavedFacts).mockResolvedValueOnce([])
  renderPage()
  expect(
    await screen.findByText(/You haven't saved any facts yet/),
  ).toBeInTheDocument()
})

test('lists saved facts in the order the server sends (newest first)', async () => {
  renderPage()
  const items = await screen.findAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('France, 2022: 17.2%')
  expect(items[1]).toHaveTextContent('United Kingdom, 2022: 26.9%')
  expect(items[1]).toHaveTextContent('Note: Use in intro')
})

test('shows an error and recovers with Try again when loading fails', async () => {
  vi.mocked(listSavedFacts).mockRejectedValueOnce(new ApiError(500, 'down'))
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load your saved facts.",
  )
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findAllByRole('listitem')).toHaveLength(2)
})

test('Delete calls the API with the id, removes the fact and announces it', async () => {
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Delete France, 2022' }),
  )
  expect(await screen.findByText('Deleted France, 2022.')).toBeInTheDocument()
  expect(deleteSavedFact).toHaveBeenCalledWith('f-2')
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})

test('Edit note: labelled box with the current note, saves through the API', async () => {
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Edit note for United Kingdom, 2022',
    }),
  )
  const box = screen.getByLabelText('Note for United Kingdom, 2022')
  expect(box).toHaveValue('Use in intro')
  expect(box).toHaveAttribute('maxLength', '280')

  fireEvent.change(box, { target: { value: 'Use in conclusion' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }))

  expect(
    await screen.findByText('Note saved for United Kingdom, 2022.'),
  ).toBeInTheDocument()
  expect(updateSavedFactNote).toHaveBeenCalledWith('f-1', 'Use in conclusion')
  expect(screen.getByText('Note: Use in conclusion')).toBeInTheDocument()
})

test('Cancel closes the edit box without saving', async () => {
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Edit note for United Kingdom, 2022',
    }),
  )
  fireEvent.change(screen.getByLabelText('Note for United Kingdom, 2022'), {
    target: { value: 'changed' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(updateSavedFactNote).not.toHaveBeenCalled()
  expect(screen.getByText('Note: Use in intro')).toBeInTheDocument()
})

test("a failed note save shows the server's message and keeps the box open", async () => {
  vi.mocked(updateSavedFactNote).mockRejectedValueOnce(
    new ApiError(404, 'Saved fact not found'),
  )
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Edit note for United Kingdom, 2022',
    }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
  expect(
    await screen.findByText("Couldn't save the note: Saved fact not found"),
  ).toBeInTheDocument()
  expect(
    screen.getByLabelText('Note for United Kingdom, 2022'),
  ).toBeInTheDocument()
})

test('Copy all citations copies one citation per line', async () => {
  const writeText = mockClipboard(() => Promise.resolve())
  renderPage()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Copy all citations' }),
  )
  expect(await screen.findByText('Copied 2 citations.')).toBeInTheDocument()
  expect(writeText).toHaveBeenCalledWith(
    [
      'France, 2022: 17.2% of adults (18+) had obesity. Source: Test source.',
      'United Kingdom, 2022: 26.9% of adults (18+) had obesity. Source: Test source.',
    ].join('\n'),
  )
})

test('each button names its fact for screen readers', async () => {
  renderPage()
  const list = await screen.findByRole('list')
  expect(
    within(list)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label')),
  ).toEqual([
    'Edit note for France, 2022',
    'Delete France, 2022',
    'Edit note for United Kingdom, 2022',
    'Delete United Kingdom, 2022',
  ])
})
