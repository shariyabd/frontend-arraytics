import { useCallback } from 'react'
import { contactListKey, contactsApi } from '../../api/contacts'
import { ApiError } from '../../api/client'
import { invalidate, useResource } from '../../lib/resourceCache'
import type { ContactListQuery } from '../../api/types'

export function useContactList(query: ContactListQuery) {
  const key = contactListKey(query)

  const { data, error, isLoading, isValidating } = useResource(
    key,
    (signal) => contactsApi.list(query, signal),
    { keepPreviousData: true },
  )

  // Drop every cached contact-list page so the next read refetches.
  const reload = useCallback(() => invalidate('/contacts'), [])

  let message: string | null = null
  if (error && !(error instanceof ApiError && error.isUnauthorized)) {
    message =
      error instanceof ApiError
        ? error.message
        : 'We couldn’t load your contacts.'
  }

  return {
    contacts: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading || isValidating,
    error: message,
    reload,
  }
}
