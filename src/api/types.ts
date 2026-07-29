export type Gender = 'Male' | 'Female' | 'Other'

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface ApiErrorBody {
  success: false
  message: string
  errors?: Record<string, string[]> | null
}

export interface AuthUser {
  id: number
  name: string
  email: string
}

export interface LoginData {
  user: AuthUser
  token: string
  token_type: string
}

export interface Contact {
  id: number
  name: string
  phone: string
  email: string
  website: string | null
  gender: Gender
  age: number
  nationality: string
  created_by: number
  created_at: string
}

export interface ContactInput {
  name: string
  phone: string
  email: string
  website: string | null
  gender: Gender
  age: number
  nationality: string
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ContactListData {
  data: Contact[]
  meta: PaginationMeta
}

export interface ContactListQuery {
  search?: string
  gender?: Gender | ''
  nationality?: string
  min_age?: number
  max_age?: number
  per_page?: number
  page?: number
}
