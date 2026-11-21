import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { fetchMe, signOut } from '../api/client.ts'
import { authValue } from '../test/authState.ts'
import WithAuth from '../test/WithAuth.tsx'
import { safeNext, useAuth } from './auth.ts'
import AuthProvider from './AuthProvider.tsx'
import RequireAuth from './RequireAuth.tsx'

vi.mock('../api/client.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client.ts')>()
  return { ...actual, fetchMe: vi.fn(), signOut: vi.fn() }
})

describe('safeNext (no open redirects)', () => {
  test.each([
    ['/my-report', '/my-report'],
    ['/explore?country=GBR', '/explore?country=GBR'],
    [null, '/my-report'],
    ['', '/my-report'],
    ['https://evil.example', '/my-report'],
    ['//evil.example', '/my-report'],
    ['/\\evil.example', '/my-report'],
    ['javascript:alert(1)', '/my-report'],
    ['/login', '/my-report'],
    ['/login?next=/x', '/my-report'],
    ['/login/', '/my-report'],
    // Hidden characters that browsers drop (security review, Medium):
    ['/\t/evil.example', '/my-report'],
    ['/\n/evil.example', '/my-report'],
    ['/\r/evil.example', '/my-report'],
    ['/\u0000/evil.example', '/my-report'],
    ['/ /evil.example', '/my-report'],
    ['/\u007f/evil.example', '/my-report'],
    ['/\t\\evil.example', '/my-report'],
    ['\t//evil.example', '/my-report'],
    // Allowed: our own pages, with query and #hash kept.
    ['/my-report#latest', '/my-report#latest'],
    ['/explore?country=GBR&x=1', '/explore?country=GBR&x=1'],
    ['/learn/../my-report', '/my-report'],
    ['/explore/%2F%2Fevil.example', '/explore/%2F%2Fevil.example'],
    // Tidied up by the browser into "//evil.example":
    ['/.//evil.example', '/my-report'],
    ['/.///evil.example', '/my-report'],
  ])('%j → %s', (next, expected) => {
    expect(safeNext(next)).toBe(expected)
  })

  test('the exact link from the review is stopped', () => {
    // What the login page reads from /login?next=%2F%09%2Fevil.example
    const next = new URLSearchParams('next=%2F%09%2Fevil.example').get('next')
    expect(next).toBe('/\t/evil.example')
    // A browser would really treat it as another website...
    expect(new URL(next!, 'https://our-site.invalid').host).toBe('evil.example')
    // ...so safeNext refuses it.
    expect(safeNext(next)).toBe('/my-report')
  })

  test('whatever comes back always stays on our own site', () => {
    const tricky = [
      '/%09/evil.example',
      '/%5Cevil.example',
      '/.//evil.example',
      '/a/../../evil.example',
      '/explore?next=https://evil.example',
    ]
    for (const next of tricky) {
      const result = safeNext(next)
      expect(new URL(result, 'https://our-site.invalid').host).toBe(
        'our-site.invalid',
      )
    }
  })
})

describe('RequireAuth', () => {
  function LoginProbe() {
    const location = useLocation()
    return <p>login page {location.search}</p>
  }

  function renderAt(status: 'loading' | 'signedIn' | 'signedOut') {
    render(
      <MemoryRouter initialEntries={['/my-report?x=1']}>
        <WithAuth value={authValue(status)}>
          <Routes>
            <Route
              path="/my-report"
              element={
                <RequireAuth>
                  <h1>Private page</h1>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<LoginProbe />} />
          </Routes>
        </WithAuth>
      </MemoryRouter>,
    )
  }

  test('signed in: shows the page', () => {
    renderAt('signedIn')
    expect(
      screen.getByRole('heading', { name: 'Private page' }),
    ).toBeInTheDocument()
  })

  test('signed out: redirects to /login with ?next back to this page', () => {
    renderAt('signedOut')
    expect(screen.queryByText('Private page')).not.toBeInTheDocument()
    expect(
      screen.getByText('login page ?next=%2Fmy-report%3Fx%3D1'),
    ).toBeInTheDocument()
  })

  test('while checking: shows a status message, not the page', () => {
    renderAt('loading')
    expect(screen.getByRole('status')).toHaveTextContent('Checking sign-in…')
    expect(screen.queryByText('Private page')).not.toBeInTheDocument()
  })
})

describe('AuthProvider', () => {
  function Probe() {
    const { status, user, signOut: doSignOut } = useAuth()
    return (
      <>
        <p>
          {status}
          {user ? `:${user.email}` : ''}
        </p>
        <button type="button" onClick={() => void doSignOut()}>
          out
        </button>
      </>
    )
  }

  afterEach(() => vi.clearAllMocks())

  test('loading → signed in, from GET /api/auth/me', async () => {
    vi.mocked(fetchMe).mockResolvedValue({ name: 'Ann', email: 'a@b.c' })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('signedIn:a@b.c')).toBeInTheDocument()
  })

  test('signed out when /me says 401', async () => {
    vi.mocked(fetchMe).mockResolvedValue(null)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(await screen.findByText('signedOut')).toBeInTheDocument()
  })

  test('sign out calls the API and clears the user, even if the call fails', async () => {
    vi.mocked(fetchMe).mockResolvedValue({ name: 'Ann', email: 'a@b.c' })
    vi.mocked(signOut).mockRejectedValue(new Error('offline'))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await screen.findByText('signedIn:a@b.c')
    screen.getByRole('button', { name: 'out' }).click()
    expect(await screen.findByText('signedOut')).toBeInTheDocument()
    expect(signOut).toHaveBeenCalled()
  })
})
