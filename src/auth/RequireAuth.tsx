import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './auth.ts'

// Wraps pages that show a user's own data. Signed out → /login, then back.
function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <p role="status" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        Checking sign-in…
      </p>
    )
  }
  if (status === 'signedOut') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return children
}

export default RequireAuth
