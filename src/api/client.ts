import type { ApiErrorBody } from './types'

// Base path prepended to every request. Set VITE_API_BASE_URL to an absolute
// origin in production; the default `/api/v1` is a relative path the Vite dev
// proxy (see vite.config.ts) forwards to VITE_API_TARGET during development.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>
  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
  get isValidation() {
    return this.status === 422
  }
  get isNotFound() {
    return this.status === 404
  }
  get isRateLimited() {
    return this.status === 429
  }
  get isUnauthorized() {
    return this.status === 401
  }
}

let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

interface RequestOptions {
  method?: string
  body?: unknown

  skipAuthRedirect?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuthRedirect, signal } = opts

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, 'Unable to reach the server. Check your connection.')
  }

  const text = await res.text()
  const payload = text ? safeParse(text) : null

  if (res.ok) {

    return (payload?.data ?? null) as T
  }

  if (res.status === 401 && !skipAuthRedirect) {
    onUnauthorized?.()
  }

  const errBody = (payload ?? {}) as ApiErrorBody
  const message =
    errBody.message ||
    (res.status === 401
      ? 'Your session has expired. Please log in again.'
      : res.status >= 500
        ? 'Something went wrong, please try again.'
        : 'Request failed.')
  throw new ApiError(res.status, message, errBody.errors ?? {})
}

function safeParse(text: string): (ApiErrorBody & { data?: unknown }) | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body: unknown, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
