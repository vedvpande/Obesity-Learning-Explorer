import { createContext, useContext } from 'react'
import type { SignedInUser } from '../api/client.ts'

// The real sign-in state, read from GET /api/auth/me. The session itself is
// an HttpOnly cookie the browser's JavaScript can never read.
export type User = SignedInUser

export type AuthValue = {
  status: 'loading' | 'signedIn' | 'signedOut'
  user: User | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue>({
  status: 'signedOut',
  user: null,
  refresh: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Browsers silently drop tabs/newlines and treat "\" like "/", so
// "/\t/evil.example" or "/\evil.example" would really mean another website.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000- \u007f\\]/

// A made-up base address: only used to see where `next` would really lead.
const OUR_SITE = 'https://our-site.invalid'

// Only our own pages may be a "go back to" address after signing in:
// "/my-report" is fine; "https://evil.example", "//evil.example" and tricks
// with hidden characters are not. The address is resolved exactly like a
// browser would, and must stay on our own site.
export function safeNext(next: string | null, fallback = '/my-report'): string {
  if (!next || UNSAFE_CHARACTERS.test(next)) return fallback
  if (!next.startsWith('/') || next.startsWith('//')) return fallback

  let url: URL
  try {
    url = new URL(next, OUR_SITE)
  } catch {
    return fallback
  }
  if (url.origin !== OUR_SITE) return fallback

  // Check the tidied-up result too: "/.//evil.example" becomes
  // "//evil.example", which a browser would treat as another website.
  const path = url.pathname + url.search + url.hash
  if (path.startsWith('//')) return fallback
  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) {
    return fallback
  }
  return path
}
