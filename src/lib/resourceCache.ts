import { useEffect, useRef, useState } from 'react'

/**
 * A tiny stale-while-revalidate cache for GET-style resources.
 *
 * Goals (per vercel-react-best-practices `client-swr-dedup`):
 *  - Deduplicate concurrent identical requests (one in-flight promise per key).
 *  - Serve cached data instantly on remount/navigation, then revalidate.
 *  - Let mutations (create/update/delete) invalidate keys so mounted hooks refetch.
 *
 * Intentionally minimal — no time-based expiry, focus, or retry logic. Reach
 * for SWR / TanStack Query if those become necessary.
 */

type Entry<T> = { data?: T; error?: unknown; hasData: boolean }

const cache = new Map<string, Entry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()
const listeners = new Map<string, Set<() => void>>()

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn())
}

function subscribe(key: string, fn: () => void): () => void {
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(fn)
  return () => {
    set!.delete(fn)
    if (set!.size === 0) listeners.delete(key)
  }
}

/** Fetch `key`, deduping concurrent callers and caching the result. */
function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, hasData: true })
      return data
    })
    .catch((error) => {
      // AbortError is not a real failure — leave any cached data intact.
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
      cache.set(key, { error, hasData: false })
      throw error
    })
    .finally(() => {
      inflight.delete(key)
      notify(key)
    })

  inflight.set(key, promise)
  return promise
}

/**
 * Drop cached entries whose key starts with `prefix` and wake any mounted
 * hooks so they refetch. Call after a mutation, e.g. `invalidate('/contacts')`.
 */
export function invalidate(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
      notify(key)
    }
  }
}

export interface Resource<T> {
  data: T | undefined
  error: unknown
  isLoading: boolean
  isValidating: boolean
}

/**
 * Subscribe to a cached resource.
 *
 * @param key      Stable cache key (e.g. the request path + query string).
 *                 Pass `null` to disable fetching (e.g. invalid id).
 * @param fetcher  Called with an AbortSignal when a fetch is needed.
 */
export function useResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: { keepPreviousData?: boolean } = {},
): Resource<T> {
  const { keepPreviousData = false } = options
  const [, forceRender] = useState(0)

  // Hold the fetcher in a ref so its identity doesn't drive revalidation —
  // only `key` does (SWR semantics). Callers needn't memoize the fetcher.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Retains the last resolved data so a key change can show stale data while
  // the next key revalidates (SWR's `keepPreviousData`).
  const previousDataRef = useRef<T | undefined>(undefined)

  useEffect(() => {
    if (key == null) return
    let controller: AbortController | null = null

    const startFetch = () => {
      if (inflight.has(key)) return
      controller = new AbortController()
      const signal = controller.signal
      revalidate(key, () => fetcherRef.current(signal)).catch(() => {
        // Errors surface through the cache entry read below.
      })
    }

    const onNotify = () => {
      // A notify with a cleared entry means it was invalidated — refetch.
      if (!cache.has(key) && !inflight.has(key)) startFetch()
      forceRender((n) => n + 1)
    }
    const unsubscribe = subscribe(key, onNotify)

    // Revalidate on mount / key change (SWR semantics).
    startFetch()
    forceRender((n) => n + 1)

    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [key])

  const entry = key != null ? cache.get(key) : undefined
  const isValidating = key != null && inflight.has(key)

  let data: T | undefined
  if (entry?.hasData) {
    data = entry.data as T
    previousDataRef.current = data
  } else if (keepPreviousData) {
    data = previousDataRef.current
  }

  return {
    data,
    error: entry?.error,
    // Only a hard load (no data to show at all) counts as loading.
    isLoading: isValidating && data === undefined,
    isValidating,
  }
}
