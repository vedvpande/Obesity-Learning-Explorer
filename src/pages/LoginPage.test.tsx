import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ApiError, signInWithGoogle } from '../api/client.ts'
import { loadScript } from '../lib/loadScript.ts'
import { authValue } from '../test/authState.ts'
import WithAuth from '../test/WithAuth.tsx'
import LoginPage from './LoginPage.tsx'

vi.mock('../lib/loadScript.ts', () => ({ loadScript: vi.fn() }))
vi.mock('../api/client.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client.ts')>()
  return { ...actual, signInWithGoogle: vi.fn() }
})

// Fake browser APIs for Cloudflare Turnstile and Google Identity Services,
// which normally load from their own websites.
let turnstileOptions: TurnstileOptions | undefined
let googleCallback: ((r: { credential: string }) => void) | undefined
const turnstile = {
  render: vi.fn((_el: HTMLElement, options: TurnstileOptions) => {
    turnstileOptions = options
    return 'widget-1'
  }),
  reset: vi.fn(),
  remove: vi.fn(),
}
const googleId = {
  initialize: vi.fn(
    (o: {
      client_id: string
      callback: (r: { credential: string }) => void
    }) => {
      googleCallback = o.callback
    },
  ),
  renderButton: vi.fn(),
}

function renderLogin(
  url = '/login?next=/my-report',
  auth = authValue('signedOut'),
) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <WithAuth value={auth}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-report" element={<h1>My Report page</h1>} />
        </Routes>
      </WithAuth>
    </MemoryRouter>,
  )
  return auth
}

async function passTurnstile(token = 'turnstile-token') {
  await vi.waitFor(() => expect(turnstileOptions).toBeDefined())
  act(() => turnstileOptions!.callback(token))
  await vi.waitFor(() => expect(googleCallback).toBeDefined())
}

beforeEach(() => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key')
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id')
  vi.mocked(loadScript).mockResolvedValue(undefined)
  vi.mocked(signInWithGoogle).mockReset()
  turnstileOptions = undefined
  googleCallback = undefined
  Object.assign(window, { turnstile, google: { accounts: { id: googleId } } })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

test('shows the human check first; the Google button waits for it', async () => {
  renderLogin()
  expect(
    screen.getByRole('heading', { level: 1, name: 'Sign in' }),
  ).toBeInTheDocument()
  await vi.waitFor(() =>
    expect(turnstile.render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'site-key' }),
    ),
  )
  expect(
    screen.getByText('Complete the human check first.'),
  ).toBeInTheDocument()
  expect(googleId.initialize).not.toHaveBeenCalled()
})

test('after the human check, the Google button uses our client id', async () => {
  renderLogin()
  await passTurnstile()
  expect(googleId.initialize).toHaveBeenCalledWith(
    expect.objectContaining({ client_id: 'client-id' }),
  )
  expect(googleId.renderButton).toHaveBeenCalled()
})

test('signing in sends both tokens, refreshes, and goes to ?next', async () => {
  vi.mocked(signInWithGoogle).mockResolvedValue({
    name: 'Ann',
    email: 'ann@example.com',
  })
  const auth = renderLogin()
  await passTurnstile('ts-1')
  await act(async () => googleCallback!({ credential: 'google-credential' }))

  expect(signInWithGoogle).toHaveBeenCalledWith('google-credential', 'ts-1')
  expect(auth.refresh).toHaveBeenCalled()
  expect(
    await screen.findByRole('heading', { name: 'My Report page' }),
  ).toBeInTheDocument()
})

test('if sign-in fails: shows the reason and asks for a fresh human check', async () => {
  vi.mocked(signInWithGoogle).mockRejectedValue(
    new ApiError(403, 'The human check failed. Please try again.'),
  )
  renderLogin()
  await passTurnstile()
  await act(async () => googleCallback!({ credential: 'c' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'The human check failed. Please try again.',
  )
  expect(turnstile.reset).toHaveBeenCalledWith('widget-1')
  expect(
    screen.getByText('Complete the human check first.'),
  ).toBeInTheDocument()
})

test('already signed in: goes straight to ?next', async () => {
  renderLogin('/login?next=/my-report', authValue('signedIn'))
  expect(
    await screen.findByRole('heading', { name: 'My Report page' }),
  ).toBeInTheDocument()
})

test('a ?next pointing at another website is ignored', async () => {
  renderLogin('/login?next=https://evil.example', authValue('signedIn'))
  expect(
    await screen.findByRole('heading', { name: 'My Report page' }),
  ).toBeInTheDocument()
})

test('without the public keys, it says sign-in is not set up', () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
  renderLogin()
  expect(screen.getByRole('alert')).toHaveTextContent(
    "Sign-in isn't set up on this site yet.",
  )
  expect(loadScript).not.toHaveBeenCalled()
})

test('if the Turnstile script cannot load, it says so', async () => {
  vi.mocked(loadScript).mockRejectedValue(new Error('offline'))
  renderLogin()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    "The human check couldn't load.",
  )
})

test('a ?next with a hidden tab (/%09/evil.example) cannot leave the site', async () => {
  renderLogin('/login?next=%2F%09%2Fevil.example', authValue('signedIn'))
  expect(
    await screen.findByRole('heading', { name: 'My Report page' }),
  ).toBeInTheDocument()
})
