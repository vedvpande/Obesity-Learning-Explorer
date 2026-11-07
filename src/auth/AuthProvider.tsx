import { useState, type ReactNode } from 'react'
import type { MockUser } from '../mocks/savedFacts.ts'
import { AuthContext, DEMO_USER } from './auth.ts'

const STORAGE_KEY = 'demoSignedIn'

function wasSignedIn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'yes'
  } catch {
    return false
  }
}

function remember(signedIn: boolean) {
  try {
    if (signedIn) localStorage.setItem(STORAGE_KEY, 'yes')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Not remembered, but sign-in still works for this visit.
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() =>
    wasSignedIn() ? DEMO_USER : null,
  )

  function signIn() {
    remember(true)
    setUser(DEMO_USER)
  }

  function signOut() {
    remember(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
