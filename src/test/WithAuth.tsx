import type { ReactNode } from 'react'
import { AuthContext, type AuthValue } from '../auth/auth.ts'

// Gives a component a chosen sign-in state (see authState.ts).
function WithAuth({
  value,
  children,
}: {
  value: AuthValue
  children: ReactNode
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default WithAuth
