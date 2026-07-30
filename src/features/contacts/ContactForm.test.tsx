import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './ContactForm'

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn()
  render(
    <ContactForm
      submitLabel="Save"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  )
  return { onSubmit, onCancel }
}

describe('ContactForm', () => {
  it('shows inline validation errors and does not submit an empty form', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Phone is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Gender is required.')).toBeInTheDocument()
    expect(screen.getByText('Age is required.')).toBeInTheDocument()
    expect(screen.getByText('Nationality is required.')).toBeInTheDocument()

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('surfaces a specific error for an invalid email', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/Email/), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid form with normalised input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm(onSubmit)

    await user.type(screen.getByLabelText(/Name/), 'Jane Doe')
    await user.type(screen.getByLabelText(/Phone/), '+1 555 123 4567')
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Female' }))
    await user.type(screen.getByLabelText(/Age/), '30')
    await user.type(screen.getByLabelText(/Nationality/), 'Canada')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Jane Doe',
      phone: '+1 555 123 4567',
      email: 'jane@example.com',
      website: null,
      gender: 'Female',
      age: 30,
      nationality: 'Canada',
    })
  })
})
