import { createContext } from 'react'
import type { AuthUser } from '../api/types'
import type { LoginCredentials } from '../api/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus

  notice: string | null
  clearNotice: () => void
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
