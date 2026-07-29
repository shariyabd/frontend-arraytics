import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../components/toast/useToast'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Alert } from '../components/ui/Alert'
import { IconBook } from '../components/Icon'
import {
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../lib/validation'

interface FieldState {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
}

export function RegisterPage() {
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldState>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lockSeconds, setLockSeconds] = useState(0)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'authenticated') navigate('/contacts', { replace: true })
  }, [status, navigate])

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (lockSeconds <= 0) return
    const t = window.setInterval(() => setLockSeconds((s) => s - 1), 1000)
    return () => window.clearInterval(t)
  }, [lockSeconds])

  const locked = lockSeconds > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    setFormError(null)

    const fieldErrors: FieldState = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      password_confirmation: validatePasswordConfirmation(
        password,
        confirmation,
      ),
    }
    if (
      fieldErrors.name ||
      fieldErrors.email ||
      fieldErrors.password ||
      fieldErrors.password_confirmation
    ) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    setSubmitting(true)
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmation,
        device_name: 'web',
      })
      toast.success('Welcome! Your account is ready.')
      navigate('/contacts', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimited) {
          setLockSeconds(60)
          setFormError(
            'Too many attempts. Please wait a moment before trying again.',
          )
        } else if (err.isValidation) {
          setErrors({
            name: err.fieldErrors.name?.[0],
            email: err.fieldErrors.email?.[0],
            password: err.fieldErrors.password?.[0],
            password_confirmation: err.fieldErrors.password_confirmation?.[0],
          })
          setFormError('Please fix the highlighted fields and try again.')
        } else {
          setFormError(err.message)
        }
      } else {
        setFormError('Something went wrong, please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="card__body">
          <div className="auth-brand">
            <span className="brand__mark">
              <IconBook size={22} />
            </span>
            <div>
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-sub">Start managing your address book</p>
            </div>
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
            style={{ marginTop: formError ? 20 : 0 }}
          >
            <Field label="Name" required error={errors.name}>
              {(aria) => (
                <input
                  {...aria}
                  ref={nameRef}
                  type="text"
                  className={`input ${errors.name ? 'input--invalid' : ''}`}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  maxLength={255}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              )}
            </Field>

            <Field label="Email" required error={errors.email}>
              {(aria) => (
                <input
                  {...aria}
                  type="email"
                  className={`input ${errors.email ? 'input--invalid' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="username"
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              )}
            </Field>

            <Field
              label="Password"
              required
              error={errors.password}
              hint="At least 8 characters."
            >
              {(aria) => (
                <input
                  {...aria}
                  type="password"
                  className={`input ${errors.password ? 'input--invalid' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              )}
            </Field>

            <Field
              label="Confirm password"
              required
              error={errors.password_confirmation}
            >
              {(aria) => (
                <input
                  {...aria}
                  type="password"
                  className={`input ${errors.password_confirmation ? 'input--invalid' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={submitting}
                />
              )}
            </Field>

            <Button
              type="submit"
              variant="primary"
              block
              loading={submitting}
              disabled={locked}
            >
              {locked ? `Try again in ${lockSeconds}s` : 'Create account'}
            </Button>
          </form>

          <p className="auth-alt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
