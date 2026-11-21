import {
  ApiError,
  createSavedFact,
  deleteSavedFact,
  fetchExploreData,
  fetchMe,
  listSavedFacts,
  signInWithGoogle,
  signOut,
  updateSavedFactNote,
} from './client.ts'

function respond(status: number, body?: unknown) {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      body === undefined
        ? new Response(null, { status })
        : Response.json(body, { status }),
    ),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('fetchExploreData turns /api/rankings into countries and rates', async () => {
  respond(200, {
    source: 'OWID',
    countries: [
      { code: 'GBR', name: 'United Kingdom', rate1990: 12, rate2022: 27 },
      { code: 'ZZZ', name: 'No data', rate1990: null, rate2022: null },
    ],
  })
  expect(await fetchExploreData()).toEqual({
    countries: [
      { code: 'GBR', name: 'United Kingdom' },
      { code: 'ZZZ', name: 'No data' },
    ],
    rates: [
      { countryCode: 'GBR', year: 1990, ratePercent: 12, source: 'OWID' },
      { countryCode: 'GBR', year: 2022, ratePercent: 27, source: 'OWID' },
    ],
  })
})

test('sends the right method, address and body for each action', async () => {
  const fetchMock = respond(200, [])
  await listSavedFacts()
  await createSavedFact({ countryCode: 'GBR', year: 2022, note: 'hi' })
  await updateSavedFactNote('abc', 'new note')
  respond(204)
  await deleteSavedFact('a b')
  expect(fetchMock.mock.calls.map((c) => c as unknown[])).toEqual([
    [
      '/api/saved-facts',
      expect.objectContaining({ headers: expect.anything() }),
    ],
    [
      '/api/saved-facts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ countryCode: 'GBR', year: 2022, note: 'hi' }),
      }),
    ],
    [
      '/api/saved-facts?id=abc',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ note: 'new note' }),
      }),
    ],
  ])
})

test('the id is URL-encoded', async () => {
  const fetchMock = respond(204)
  await deleteSavedFact('a b&c')
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/saved-facts?id=a%20b%26c',
    expect.objectContaining({ method: 'DELETE' }),
  )
})

test('an error response becomes an ApiError with the server message', async () => {
  respond(400, { error: 'Note must be 280 characters or fewer' })
  await expect(
    createSavedFact({ countryCode: 'GBR', year: 2022, note: 'x' }),
  ).rejects.toEqual(new ApiError(400, 'Note must be 280 characters or fewer'))
})

test('an error without JSON still gives a friendly message', async () => {
  respond(500)
  const err = await listSavedFacts().catch((e: unknown) => e)
  expect(err).toBeInstanceOf(ApiError)
  expect(err).toMatchObject({
    status: 500,
    message: 'Something went wrong. Please try again.',
  })
})

test('fetchMe returns the user, or null when signed out or offline', async () => {
  respond(200, { name: 'Ann', email: 'a@b.c' })
  expect(await fetchMe()).toEqual({ name: 'Ann', email: 'a@b.c' })
  respond(401, { error: 'Sign in to continue.' })
  expect(await fetchMe()).toBeNull()
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('offline'))),
  )
  expect(await fetchMe()).toBeNull()
})

test('signInWithGoogle posts both tokens; signOut posts to logout', async () => {
  const fetchMock = respond(200, { name: 'Ann', email: 'a@b.c' })
  await signInWithGoogle('cred', 'ts')
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/auth/google',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ credential: 'cred', turnstileToken: 'ts' }),
    }),
  )
  const logoutMock = respond(204)
  await signOut()
  expect(logoutMock).toHaveBeenCalledWith(
    '/api/auth/logout',
    expect.objectContaining({ method: 'POST' }),
  )
})
