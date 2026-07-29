import { useCallback, useEffect, useRef, useState } from 'react'
import {
  authApi,
  type LoginCredentials,
  type RegisterCredentials,
} from '../api/auth'
import {
  setAuthToken,
  setUnauthorizedHandler,
} from '../api/client'
import type { AuthUser } from '../api/types'
import { AuthContext, type AuthStatus } from './context'

const TOKEN_KEY = 'ab.token'
const USER_KEY = 'ab.user'

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(TOKEN_KEY) ? 'loading' : 'unauthenticated',
  )
  const [notice, setNotice] = useState<string | null>(null)

  const expiredRef = useRef(false)

  const persist = useCallback((token: string | null, u: AuthUser | null) => {
    setAuthToken(token)
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(USER_KEY)
  }, [])

  const clearSession = useCallback(() => {
    persist(null, null)
    setUser(null)
    setStatus('unauthenticated')
  }, [persist])

  const startSession = useCallback(
    (token: string, u: AuthUser) => {
      expiredRef.current = false
      persist(token, u)
      setUser(u)
      setStatus('authenticated')
      setNotice(null)
    },
    [persist],
  )

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const data = await authApi.login(credentials)
      startSession(data.token, data.user)
    },
    [startSession],
  )

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const data = await authApi.register(credentials)
      startSession(data.token, data.user)
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {

    }
    clearSession()
  }, [clearSession])

  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (expiredRef.current) return
      expiredRef.current = true
      clearSession()
      setNotice('Your session has expired. Please log in again.')
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    setAuthToken(token)
    let active = true
    authApi
      .me()
      .then((u) => {
        if (!active) return
        setUser(u)
        persist(token, u)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) return

        expiredRef.current = true
        clearSession()
      })
    return () => {
      active = false
    }
  }, [persist, clearSession])

  return (
    <AuthContext.Provider
      value={{ user, status, notice, clearNotice, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
