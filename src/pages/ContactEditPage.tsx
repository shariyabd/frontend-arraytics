import { Link, useNavigate, useParams } from 'react-router-dom'
import { contactsApi } from '../api/contacts'
import type { ContactInput } from '../api/types'
import { useContact } from '../features/contacts/useContact'
import { ContactForm } from '../features/contacts/ContactForm'
import { invalidate } from '../lib/resourceCache'
import type { ContactFormValues } from '../lib/validation'
import { useToast } from '../components/toast/useToast'
import { Button } from '../components/ui/Button'
import { CenterLoader, StateBlock } from '../components/ui/StateBlock'
import { IconAlert, IconArrowLeft, IconInbox } from '../components/Icon'

export function ContactEditPage() {
  const { id } = useParams()
  const contactId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { contact, status, error } = useContact(contactId)

  if (status === 'loading') return <CenterLoader label="Loading contact…" />

  if (status === 'notfound') {
    return (
      <StateBlock
        icon={<IconInbox size={24} />}
        title="Contact not found"
        description="This contact may have been deleted."
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

  const initial: Partial<ContactFormValues> = {
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    website: contact.website ?? '',
    gender: contact.gender,
    age: String(contact.age),
    nationality: contact.nationality,
  }

  const handleSubmit = async (input: ContactInput) => {
    const updated = await contactsApi.update(contact.id, input)
    invalidate('/contacts')
    toast.success(`${updated.name} was updated.`)
    navigate(`/contacts/${contact.id}`, { replace: true })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to={`/contacts/${contact.id}`} className="back-link">
        <IconArrowLeft size={15} />
        Back to details
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Edit contact</h1>
          <p className="page-head__sub">Update {contact.name}’s details.</p>
        </div>
      </div>
      <div className="card">
        <div className="card__body">
          <ContactForm
            initial={initial}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/contacts/${contact.id}`)}
          />
        </div>
      </div>
    </div>
  )
}
