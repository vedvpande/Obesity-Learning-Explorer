import { createContext, useContext } from 'react'

// Demo sign-in until real Google sign-in (#10) is built. The server acts as
// the Demo Student (DEMO_USER_ID) for every request this week.
export type User = { id: string; name: string }

export type AuthValue = {
  user: User | null
  signIn: () => void
  signOut: () => void
}

export const DEMO_USER: User = { id: 'demo-student', name: 'Demo Student' }

export const AuthContext = createContext<AuthValue>({
  user: null,
  signIn: () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
