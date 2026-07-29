import { useEffect, useState } from 'react'
import { contactsApi } from '../../api/contacts'
import { ApiError } from '../../api/client'
import type { Contact } from '../../api/types'

type Status = 'loading' | 'loaded' | 'notfound' | 'error'

interface State {
  contact: Contact | null
  status: Status
  error: string | null
}

export function useContact(id: number, reloadKey = 0) {
  const [state, setState] = useState<State>({
    contact: null,
    status: 'loading',
    error: null,
  })

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setState({ contact: null, status: 'notfound', error: null })
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading', error: null }))
    contactsApi
      .get(id, controller.signal)
      .then((contact) =>
        setState({ contact, status: 'loaded', error: null }),
      )
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (err instanceof ApiError && err.isUnauthorized) return
        if (err instanceof ApiError && err.isNotFound) {
          setState({ contact: null, status: 'notfound', error: null })
          return
        }
        setState({
          contact: null,
          status: 'error',
          error:
            err instanceof ApiError ? err.message : 'Could not load contact.',
        })
      })
    return () => controller.abort()
  }, [id, reloadKey])

  return state
}
