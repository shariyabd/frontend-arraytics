import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, ApiError } from './client'

// Build a minimal Response-like object good enough for client.ts, which only
// touches `ok`, `status` and `text()`.
function mockResponse(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as unknown as Response
}

const fetchMock = vi.fn<typeof fetch>()

// Await a promise expected to reject and return the thrown value. Typed as
// ApiError for convenience since every rejection here is an ApiError except
// where the test asserts otherwise.
async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
    throw new Error('Expected the request to reject, but it resolved.')
  } catch (err) {
    return err as ApiError
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api request success', () => {
  it('unwraps the `data` envelope on a 2xx response', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, { success: true, message: 'ok', data: { id: 1 } }),
    )
    await expect(api.get('/contacts')).resolves.toEqual({ id: 1 })
  })
})

describe('ApiError mapping', () => {
  it('maps a 422 body to validation field errors', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(422, {
        success: false,
        message: 'The given data was invalid.',
        errors: { email: ['The email field is required.'] },
      }),
    )
    const err = await rejection(api.post('/contacts', {}))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
    expect(err.isValidation).toBe(true)
    expect(err.isUnauthorized).toBe(false)
    expect(err.fieldErrors).toEqual({
      email: ['The email field is required.'],
    })
    expect(err.message).toBe('The given data was invalid.')
  })

  it('maps a 401 to isUnauthorized', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(401, { success: false, message: 'Unauthenticated.' }),
    )
    // skipAuthRedirect keeps the global unauthorized handler out of the test.
    const err = await rejection(
      api.post('/contacts', {}, { skipAuthRedirect: true }),
    )
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(401)
    expect(err.isUnauthorized).toBe(true)
    expect(err.isValidation).toBe(false)
  })

  it('maps a 404 to isNotFound', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(404, { success: false, message: 'Not found.' }),
    )
    const err = await rejection(api.get('/contacts/999'))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
    expect(err.isNotFound).toBe(true)
  })

  it('maps a 429 to isRateLimited', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(429, { success: false, message: 'Too many requests.' }),
    )
    const err = await rejection(api.get('/contacts'))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(429)
    expect(err.isRateLimited).toBe(true)
  })

  it('falls back to a generic message for a 5xx with no body message', async () => {
    fetchMock.mockResolvedValue(mockResponse(500, undefined))
    const err = await rejection(api.get('/contacts'))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(500)
    expect(err.message).toBe('Something went wrong, please try again.')
    expect(err.fieldErrors).toEqual({})
  })

  it('wraps a network failure as an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const err = await rejection(api.get('/contacts'))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)
    expect(err.message).toBe(
      'Unable to reach the server. Check your connection.',
    )
  })

  it('re-throws AbortError without wrapping it', async () => {
    fetchMock.mockRejectedValue(
      new DOMException('aborted', 'AbortError'),
    )
    const err = await rejection(api.get('/contacts'))
    expect(err).toBeInstanceOf(DOMException)
    expect(err).not.toBeInstanceOf(ApiError)
  })
})
