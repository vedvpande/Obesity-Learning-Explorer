import type { AuthValue } from '../auth/auth.ts'

// Tests choose the sign-in state directly instead of calling the API.
export const ANN = { name: 'Ann', email: 'ann@example.com' }

export function authValue(
  status: AuthValue['status'],
  overrides: Partial<AuthValue> = {},
): AuthValue {
  return {
    status,
    user: status === 'signedIn' ? ANN : null,
    refresh: vi.fn(() => Promise.resolve()),
    signOut: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}
