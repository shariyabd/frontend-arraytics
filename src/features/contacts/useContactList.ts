import { useCallback, useEffect, useState } from 'react'
import { contactsApi } from '../../api/contacts'
import { ApiError } from '../../api/client'
import type { Contact, ContactListQuery, PaginationMeta } from '../../api/types'

interface State {
  contacts: Contact[]
  meta: PaginationMeta | null
  loading: boolean
  error: string | null
}

export function useContactList(query: ContactListQuery) {
  const [state, setState] = useState<State>({
    contacts: [],
    meta: null,
    loading: true,
    error: null,
  })
  const [reloadTick, setReloadTick] = useState(0)
  const reload = useCallback(() => setReloadTick((t) => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))

    contactsApi
      .list(query, controller.signal)
      .then((data) => {
        setState({
          contacts: data.data,
          meta: data.meta,
          loading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return

        if (err instanceof ApiError && err.isUnauthorized) return
        const message =
          err instanceof ApiError
            ? err.message
            : 'We couldn’t load your contacts.'
        setState((s) => ({ ...s, loading: false, error: message }))
      })

    return () => controller.abort()
  }, [query, reloadTick])

  return { ...state, reload }
}
