import { useNavigate } from 'react-router-dom'
import { contactsApi } from '../api/contacts'
import type { ContactInput } from '../api/types'
import { ContactForm } from '../features/contacts/ContactForm'
import { useToast } from '../components/toast/useToast'
import { IconArrowLeft } from '../components/Icon'
import { Link } from 'react-router-dom'

export function ContactCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (input: ContactInput) => {
    const created = await contactsApi.create(input)
    toast.success(`${created.name} was added.`)
    navigate(`/contacts/${created.id}`, { replace: true })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to="/contacts" className="back-link">
        <IconArrowLeft size={15} />
        Back to contacts
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">New contact</h1>
          <p className="page-head__sub">Add someone to your address book.</p>
        </div>
      </div>
      <div className="card">
        <div className="card__body">
          <ContactForm
            submitLabel="Create contact"
            onSubmit={handleSubmit}
            onCancel={() => navigate('/contacts')}
          />
        </div>
      </div>
    </div>
  )
}
