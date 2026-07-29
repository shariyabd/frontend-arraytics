import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { contactsApi } from '../api/contacts'
import { ApiError } from '../api/client'
import { useContact } from '../features/contacts/useContact'
import { useToast } from '../components/toast/useToast'
import { Button } from '../components/ui/Button'
import { GenderBadge } from '../components/ui/GenderBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CenterLoader, StateBlock } from '../components/ui/StateBlock'
import {
  IconAlert,
  IconArrowLeft,
  IconEdit,
  IconExternal,
  IconInbox,
  IconTrash,
} from '../components/Icon'
import type { ReactNode } from 'react'

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ContactDetailsPage() {
  const { id } = useParams()
  const contactId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { contact, status, error } = useContact(contactId)

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (status === 'loading') return <CenterLoader label="Loading contact…" />

  if (status === 'notfound') {
    return (
      <StateBlock
        icon={<IconInbox size={24} />}
        title="Contact not found"
        description="This contact may have been deleted, or the link is invalid."
        actions={
          <Button variant="primary" onClick={() => navigate('/contacts')}>
            Back to contacts
          </Button>
        }
      />
    )
  }

  if (status === 'error' || !contact) {
    return (
      <StateBlock
        variant="error"
        icon={<IconAlert size={24} />}
        title="Couldn’t load contact"
        description={error ?? undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/contacts')}>
            Back to contacts
          </Button>
        }
      />
    )
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await contactsApi.remove(contact.id)
      toast.success(`${contact.name} was deleted.`)
      navigate('/contacts', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) {
        toast.success('That contact was already removed.')
        navigate('/contacts', { replace: true })
      } else if (err instanceof ApiError && err.isUnauthorized) {

      } else {
        toast.error(
          err instanceof ApiError ? err.message : 'Could not delete contact.',
        )
        setDeleting(false)
        setConfirming(false)
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to="/contacts" className="back-link">
        <IconArrowLeft size={15} />
        Back to contacts
      </Link>

      <div className="page-head">
        <div className="detail-header">
          <span className="avatar">{initials(contact.name)}</span>
          <div>
            <h1 className="page-head__title">{contact.name}</h1>
            <p className="page-head__sub">{contact.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={() => navigate(`/contacts/${contact.id}/edit`)}>
            <IconEdit size={16} />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <IconTrash size={16} />
            Delete
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <div className="detail-grid">
            <DetailItem label="Phone">
              <span className="u-mono">{contact.phone}</span>
            </DetailItem>
            <DetailItem label="Email">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </DetailItem>
            <DetailItem label="Gender">
              <GenderBadge gender={contact.gender} />
            </DetailItem>
            <DetailItem label="Age">{contact.age}</DetailItem>
            <DetailItem label="Nationality">{contact.nationality}</DetailItem>
            <DetailItem label="Website" empty={!contact.website}>
              {contact.website ? (
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {contact.website}
                  <IconExternal size={14} />
                </a>
              ) : (
                'Not provided'
              )}
            </DetailItem>
            <DetailItem label="Added" full>
              {formatDate(contact.created_at)}
            </DetailItem>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${contact.name}?`}
        description="This permanently removes the contact. This action cannot be undone."
        confirmLabel="Delete contact"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirming(false)}
      />
    </div>
  )
}

function DetailItem({
  label,
  children,
  empty,
  full,
}: {
  label: string
  children: ReactNode
  empty?: boolean
  full?: boolean
}) {
  return (
    <div className={`detail-item ${full ? 'detail-item--full' : ''}`}>
      <div className="detail-item__label">{label}</div>
      <div
        className={`detail-item__value ${empty ? 'detail-item__value--empty' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
