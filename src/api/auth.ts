import { api } from './client'
import type { AuthUser, LoginData } from './types'

export interface LoginCredentials {
  email: string
  password: string
  device_name?: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  password_confirmation: string
  device_name?: string
}

export const authApi = {
  register: (credentials: RegisterCredentials) =>
    api.post<LoginData>('/register', credentials, { skipAuthRedirect: true }),

  login: (credentials: LoginCredentials) =>
    api.post<LoginData>('/login', credentials, { skipAuthRedirect: true }),

  me: () => api.get<AuthUser>('/me'),

  logout: () => api.post<null>('/logout', {}),
}
