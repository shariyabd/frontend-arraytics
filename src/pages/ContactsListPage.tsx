import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { contactsApi } from '../api/contacts'
import { ApiError } from '../api/client'
import type { Contact, ContactListQuery, Gender } from '../api/types'
import { useContactList } from '../features/contacts/useContactList'
import { useDebounce } from '../lib/useDebounce'
import { GENDERS } from '../lib/validation'
import { useToast } from '../components/toast/useToast'
import { Button } from '../components/ui/Button'
import { GenderBadge } from '../components/ui/GenderBadge'
import { Pagination } from '../components/ui/Pagination'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { StateBlock } from '../components/ui/StateBlock'
import {
  IconAlert,
  IconClose,
  IconEdit,
  IconEye,
  IconFilterOff,
  IconInbox,
  IconPlus,
  IconSearch,
  IconTrash,
} from '../components/Icon'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function ContactsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const urlSearch = searchParams.get('search') ?? ''
  const urlGender = (searchParams.get('gender') as Gender | '') || ''
  const urlNationality = searchParams.get('nationality') ?? ''
  const urlMinAge = searchParams.get('min_age') ?? ''
  const urlMaxAge = searchParams.get('max_age') ?? ''
  const urlPage = Math.max(1, Number(searchParams.get('page')) || 1)
  const urlPerPage = clamp(Number(searchParams.get('per_page')) || 15, 1, 100)

  const [search, setSearch] = useState(urlSearch)
  const [nationality, setNationality] = useState(urlNationality)
  const [minAge, setMinAge] = useState(urlMinAge)
  const [maxAge, setMaxAge] = useState(urlMaxAge)

  const dSearch = useDebounce(search)
  const dNationality = useDebounce(nationality)
  const dMinAge = useDebounce(minAge)
  const dMaxAge = useDebounce(maxAge)

  const ageError =
    dMinAge && dMaxAge && Number(dMaxAge) < Number(dMinAge)
      ? 'Max age can’t be less than min age.'
      : ''
  const committedMaxAge = ageError ? '' : dMaxAge

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        const changed =
          (next.get('search') ?? '') !== dSearch ||
          (next.get('nationality') ?? '') !== dNationality ||
          (next.get('min_age') ?? '') !== dMinAge ||
          (next.get('max_age') ?? '') !== committedMaxAge
        const set = (k: string, v: string) =>
          v ? next.set(k, v) : next.delete(k)
        set('search', dSearch)
        set('nationality', dNationality)
        set('min_age', dMinAge)
        set('max_age', committedMaxAge)
        if (changed) next.delete('page')
        return next
      },
      { replace: true },
    )
  }, [dSearch, dNationality, dMinAge, committedMaxAge, setSearchParams])

  const query: ContactListQuery = useMemo(
    () => ({
      search: urlSearch || undefined,
      gender: urlGender || undefined,
      nationality: urlNationality || undefined,

      min_age: urlMinAge ? Number(urlMinAge) : undefined,
      max_age: urlMaxAge ? Number(urlMaxAge) : undefined,
      per_page: urlPerPage,
      page: urlPage,
    }),
    [
      urlSearch,
      urlGender,
      urlNationality,
      urlMinAge,
      urlMaxAge,
      urlPerPage,
      urlPage,
    ],
  )
  const { contacts, meta, loading, error, reload } = useContactList(query)

  const setParam = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        if (resetPage) next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  const hasActiveFilters =
    !!urlSearch || !!urlGender || !!urlNationality || !!urlMinAge || !!urlMaxAge

  const clearAll = () => {
    setSearch('')
    setNationality('')
    setMinAge('')
    setMaxAge('')
    setParam({
      search: null,
      gender: null,
      nationality: null,
      min_age: null,
      max_age: null,
    })
  }

  const [toDelete, setToDelete] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await contactsApi.remove(toDelete.id)
      toast.success(`${toDelete.name} was deleted.`)
      setToDelete(null)
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) {

        toast.success('That contact was already removed.')
        setToDelete(null)
        reload()
      } else if (err instanceof ApiError && err.isUnauthorized) {

      } else {
        toast.error(
          err instanceof ApiError ? err.message : 'Could not delete contact.',
        )
      }
    } finally {
      setDeleting(false)
    }
  }

  const isFirstLoad = loading && !meta

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Contacts</h1>
          <p className="page-head__sub">
            {meta
              ? `${meta.total} ${meta.total === 1 ? 'contact' : 'contacts'} in your address book`
              : 'Browse, search and manage your address book'}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/contacts/new')}>
          <IconPlus size={17} />
          Add contact
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar__row">
          <div className="search">
            <span className="search__icon">
              <IconSearch size={17} />
            </span>
            <input
              className="input"
              type="search"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search contacts"
            />
            {!!search && (
              <button
                className="search__clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <IconClose size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-panel">
          <label className="field">
            <span className="field__label">Gender</span>
            <select
              className="select"
              value={urlGender}
              onChange={(e) => setParam({ gender: e.target.value || null })}
            >
              <option value="">Any</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Nationality</span>
            <input
              className="input"
              type="text"
              placeholder="e.g. Canada"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            />
          </label>

          <div className="field">
            <span className="field__label">Age range</span>
            <div className="age-range">
              <input
                className={`input ${ageError ? 'input--invalid' : ''}`}
                type="number"
                min={1}
                max={150}
                placeholder="Min"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                aria-label="Minimum age"
              />
              <span>–</span>
              <input
                className={`input ${ageError ? 'input--invalid' : ''}`}
                type="number"
                min={1}
                max={150}
                placeholder="Max"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                aria-label="Maximum age"
              />
            </div>
            {!!ageError && (
              <p className="field__error">
                <IconAlert size={13} />
                {ageError}
              </p>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="active-filters">
            <span className="active-filters__label">Active</span>
            {!!urlSearch && (
              <FilterChip
                label={`“${urlSearch}”`}
                onRemove={() => {
                  setSearch('')
                  setParam({ search: null })
                }}
              />
            )}
            {!!urlGender && (
              <FilterChip
                label={urlGender}
                onRemove={() => setParam({ gender: null })}
              />
            )}
            {!!urlNationality && (
              <FilterChip
                label={urlNationality}
                onRemove={() => {
                  setNationality('')
                  setParam({ nationality: null })
                }}
              />
            )}
            {!!(urlMinAge || urlMaxAge) && (
              <FilterChip
                label={`Age ${urlMinAge || '1'}–${urlMaxAge || '150'}`}
                onRemove={() => {
                  setMinAge('')
                  setMaxAge('')
                  setParam({ min_age: null, max_age: null })
                }}
              />
            )}
            <button className="chip--clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {error ? (
        <StateBlock
          variant="error"
          icon={<IconAlert size={24} />}
          title="Couldn’t load contacts"
          description={error}
          actions={
            <Button variant="primary" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : isFirstLoad ? (
        <SkeletonTable />
      ) : contacts.length === 0 && hasActiveFilters ? (
        <StateBlock
          icon={<IconSearch size={24} />}
          title="No contacts match your filters"
          description="Try a different search term or loosen the filters."
          actions={
            <Button variant="secondary" onClick={clearAll}>
              <IconFilterOff size={16} />
              Clear filters
            </Button>
          }
        />
      ) : contacts.length === 0 ? (
        <StateBlock
          icon={<IconInbox size={24} />}
          title="Your address book is empty"
          description="Add your first contact to get started."
          actions={
            <Button variant="primary" onClick={() => navigate('/contacts/new')}>
              <IconPlus size={16} />
              Add contact
            </Button>
          }
        />
      ) : (
        <>
          <div
            className="table-wrap"
            style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}
            aria-busy={loading}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Nationality</th>
                  <th className="col-actions">
                    <span className="u-sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/contacts/${c.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/contacts/${c.id}`)
                    }}
                  >
                    <td className="table__name">{c.name}</td>
                    <td className="u-mono table__cell-muted">{c.phone}</td>
                    <td className="table__cell-muted">{c.email}</td>
                    <td>
                      <GenderBadge gender={c.gender} />
                    </td>
                    <td>{c.age}</td>
                    <td className="table__cell-muted">{c.nationality}</td>
                    <td>
                      <div
                        className="table__actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`View ${c.name}`}
                          onClick={() => navigate(`/contacts/${c.id}`)}
                        >
                          <IconEye size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${c.name}`}
                          onClick={() => navigate(`/contacts/${c.id}/edit`)}
                        >
                          <IconEdit size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="danger-ghost"
                          aria-label={`Delete ${c.name}`}
                          onClick={() => setToDelete(c)}
                        >
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <Pagination
              meta={meta}
              busy={loading}
              onPageChange={(p) => setParam({ page: String(p) }, false)}
              onPerPageChange={(pp) =>
                setParam({ per_page: String(pp) }, true)
              }
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.name}?`}
        description="This permanently removes the contact. This action cannot be undone."
        confirmLabel="Delete contact"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </>
  )
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="chip">
      {label}
      <button onClick={onRemove} aria-label={`Remove filter ${label}`}>
        <IconClose size={13} />
      </button>
    </span>
  )
}

function SkeletonTable() {
  return (
    <div className="table-wrap" aria-hidden="true">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Gender</th>
            <th>Age</th>
            <th>Nationality</th>
            <th className="col-actions" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} style={{ cursor: 'default' }}>
              {Array.from({ length: 7 }).map((__, j) => (
                <td key={j}>
                  <div
                    className="skeleton"
                    style={{ width: `${[70, 60, 85, 40, 30, 55, 50][j]}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
