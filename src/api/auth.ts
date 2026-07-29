import { api } from './client'
import type { AuthUser, LoginData } from './types'

export interface LoginCredentials {
  email: string
  password: string
  device_name?: string
}

export const authApi = {

  login: (credentials: LoginCredentials) =>
    api.post<LoginData>('/login', credentials, { skipAuthRedirect: true }),

  me: () => api.get<AuthUser>('/me'),

  logout: () => api.post<null>('/logout', {}),
}
