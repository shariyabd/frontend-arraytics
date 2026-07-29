import { useState } from 'react'
import { ApiError } from '../../api/client'
import type { ContactInput } from '../../api/types'
import {
  GENDERS,
  hasErrors,
  toContactInput,
  validateContactForm,
  type ContactFormValues,
  type FieldErrors,
} from '../../lib/validation'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Alert } from '../../components/ui/Alert'

const EMPTY: ContactFormValues = {
  name: '',
  phone: '',
  email: '',
  website: '',
  gender: '',
  age: '',
  nationality: '',
}

interface Props {
  initial?: Partial<ContactFormValues>
  submitLabel: string
  onSubmit: (input: ContactInput) => Promise<void>
  onCancel: () => void
}

export function ContactForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ContactFormValues>({
    ...EMPTY,
    ...initial,
  })
  const [errors, setErrors] = useState<FieldErrors<ContactFormValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }))

    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validateField = (key: keyof ContactFormValues) => {
    const all = validateContactForm(values)
    setErrors((e) => ({ ...e, [key]: all[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const clientErrors = validateContactForm(values)
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(toContactInput(values))
    } catch (err) {
      if (err instanceof ApiError && err.isValidation) {

        const mapped: FieldErrors<ContactFormValues> = {}
        for (const [field, msgs] of Object.entries(err.fieldErrors)) {
          if (field in EMPTY) {
            mapped[field as keyof ContactFormValues] = msgs[0]
          }
        }
        setErrors(mapped)
        setFormError('Please fix the highlighted fields and try again.')
      } else if (err instanceof ApiError && err.isUnauthorized) {

      } else {
        setFormError(
          err instanceof ApiError
            ? err.message
            : 'Something went wrong, please try again.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="form-grid" style={{ marginTop: formError ? 20 : 0 }}>
        <div className="form-grid__full">
          <Field label="Name" required error={errors.name}>
            {(aria) => (
              <input
                {...aria}
                className={`input ${errors.name ? 'input--invalid' : ''}`}
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => validateField('name')}
                maxLength={255}
                placeholder="Jane Doe"
              />
            )}
          </Field>
        </div>

        <Field
          label="Phone"
          required
          error={errors.phone}
          hint="Digits, optional + prefix, spaces, dashes, parentheses."
        >
          {(aria) => (
            <input
              {...aria}
              className={`input ${errors.phone ? 'input--invalid' : ''}`}
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              onBlur={() => validateField('phone')}
              maxLength={30}
              placeholder="+1 555 123 4567"
            />
          )}
        </Field>

        <Field label="Email" required error={errors.email}>
          {(aria) => (
            <input
              {...aria}
              type="email"
              className={`input ${errors.email ? 'input--invalid' : ''}`}
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              onBlur={() => validateField('email')}
              maxLength={255}
              placeholder="jane@example.com"
            />
          )}
        </Field>

        <div className="form-grid__full">
          <Field
            label="Website"
            optional
            error={errors.website}
            hint="Include http:// or https://"
          >
            {(aria) => (
              <input
                {...aria}
                type="url"
                className={`input ${errors.website ? 'input--invalid' : ''}`}
                value={values.website}
                onChange={(e) => set('website', e.target.value)}
                onBlur={() => validateField('website')}
                maxLength={255}
                placeholder="https://example.com"
              />
            )}
          </Field>
        </div>

        <Field label="Gender" required error={errors.gender}>
          {(aria) => (
            <div
              className={`segmented ${errors.gender ? 'segmented--invalid' : ''}`}
              role="group"
              aria-label="Gender"
              id={aria.id}
              aria-invalid={aria['aria-invalid']}
              aria-describedby={aria['aria-describedby']}
            >
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={values.gender === g}
                  onClick={() => set('gender', g)}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Age" required error={errors.age}>
          {(aria) => (
            <input
              {...aria}
              type="number"
              min={1}
              max={150}
              step={1}
              className={`input ${errors.age ? 'input--invalid' : ''}`}
              value={values.age}
              onChange={(e) => set('age', e.target.value)}
              onBlur={() => validateField('age')}
              placeholder="30"
            />
          )}
        </Field>

        <div className="form-grid__full">
          <Field label="Nationality" required error={errors.nationality}>
            {(aria) => (
              <input
                {...aria}
                className={`input ${errors.nationality ? 'input--invalid' : ''}`}
                value={values.nationality}
                onChange={(e) => set('nationality', e.target.value)}
                onBlur={() => validateField('nationality')}
                maxLength={255}
                placeholder="Canada"
              />
            )}
          </Field>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
