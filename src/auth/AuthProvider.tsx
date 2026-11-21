import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, signOut as apiSignOut } from '../api/client.ts'
import { AuthContext, type AuthValue, type User } from './auth.ts'

// Holds the real sign-in state for the whole app, from GET /api/auth/me.
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthValue['status']>('loading')

  const refresh = useCallback(async () => {
    const me = await fetchMe()
    setUser(me)
    setStatus(me ? 'signedIn' : 'signedOut')
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchMe().then((me) => {
      if (cancelled) return
      setUser(me)
      setStatus(me ? 'signedIn' : 'signedOut')
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Always shows "signed out", even if the request fails (e.g. offline);
  // the cookie then simply expires on its own.
  const signOut = useCallback(async () => {
    try {
      await apiSignOut()
    } catch {
      // nothing more to do
    }
    setUser(null)
    setStatus('signedOut')
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
