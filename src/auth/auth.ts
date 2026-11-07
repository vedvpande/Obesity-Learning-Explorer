import { createContext, useContext } from 'react'
import type { MockUser } from '../mocks/savedFacts.ts'

// Demo sign-in until real Google sign-in (#10) is built.
export type AuthValue = {
  user: MockUser | null
  signIn: () => void
  signOut: () => void
}

export const DEMO_USER: MockUser = { id: 'demo-student', name: 'Demo Student' }

export const AuthContext = createContext<AuthValue>({
  user: null,
  signIn: () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
