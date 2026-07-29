import { api } from './client'
import type {
  Contact,
  ContactInput,
  ContactListData,
  ContactListQuery,
} from './types'

function buildQuery(q: ContactListQuery): string {
  const params = new URLSearchParams()
  if (q.search) params.set('search', q.search)
  if (q.gender) params.set('gender', q.gender)
  if (q.nationality) params.set('nationality', q.nationality)
  if (q.min_age != null) params.set('min_age', String(q.min_age))
  if (q.max_age != null) params.set('max_age', String(q.max_age))
  if (q.per_page != null) params.set('per_page', String(q.per_page))
  if (q.page != null) params.set('page', String(q.page))
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** Cache key for a single contact resource. */
export const contactKey = (id: number) => `/contacts/${id}`

/** Cache key for a contact-list resource. Shares the `/contacts` prefix with
 *  {@link contactKey} so `invalidate('/contacts')` clears both. */
export const contactListKey = (query: ContactListQuery) =>
  `/contacts${buildQuery(query)}`

export const contactsApi = {
  list: (query: ContactListQuery, signal?: AbortSignal) =>
    api.get<ContactListData>(`/contacts${buildQuery(query)}`, signal),

  get: (id: number, signal?: AbortSignal) =>
    api.get<Contact>(`/contacts/${id}`, signal),

  create: (input: ContactInput) => api.post<Contact>('/contacts', input),

  update: (id: number, input: Partial<ContactInput>) =>
    api.put<Contact>(`/contacts/${id}`, input),

  remove: (id: number) => api.del<null>(`/contacts/${id}`),
}
