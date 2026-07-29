import { contactKey, contactsApi } from '../../api/contacts'
import { ApiError } from '../../api/client'
import { useResource } from '../../lib/resourceCache'
import type { Contact } from '../../api/types'

type Status = 'loading' | 'loaded' | 'notfound' | 'error'

interface State {
  contact: Contact | null
  status: Status
  error: string | null
}

export function useContact(id: number): State {
  const valid = Number.isFinite(id) && id > 0
  const key = valid ? contactKey(id) : null

  const { data, error } = useResource(key, (signal) =>
    contactsApi.get(id, signal),
  )

  if (!valid) return { contact: null, status: 'notfound', error: null }

  if (error) {
    // Unauthorized is handled globally (session expiry → redirect); keep the
    // spinner rather than flashing an error while that resolves.
    if (error instanceof ApiError && error.isUnauthorized) {
      return { contact: null, status: 'loading', error: null }
    }
    if (error instanceof ApiError && error.isNotFound) {
      return { contact: null, status: 'notfound', error: null }
    }
    return {
      contact: null,
      status: 'error',
      error:
        error instanceof ApiError ? error.message : 'Could not load contact.',
    }
  }

  if (data) return { contact: data, status: 'loaded', error: null }

  return { contact: null, status: 'loading', error: null }
}
