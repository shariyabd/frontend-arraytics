import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Alert } from '../components/ui/Alert'
import { IconBook } from '../components/Icon'
import { validateEmail, validatePassword } from '../lib/validation'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login, notice, clearNotice, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/contacts'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lockSeconds, setLockSeconds] = useState(0)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'authenticated') navigate('/contacts', { replace: true })
  }, [status, navigate])

  useEffect(() => {
    emailRef.current?.focus()
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
    clearNotice()
    setFormError(null)

    const fieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    if (fieldErrors.email || fieldErrors.password) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    setSubmitting(true)
    try {
      await login({ email: email.trim(), password, device_name: 'web' })
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimited) {
          setLockSeconds(60)
          setFormError(
            'Too many attempts. Please wait a moment before trying again.',
          )
        } else if (err.isValidation) {

          const msg =
            err.fieldErrors.email?.[0] ??
            'These credentials do not match our records.'
          setFormError(msg)
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
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-sub">Log in to manage your address book</p>
            </div>
          </div>

          {notice && <Alert variant="warning">{notice}</Alert>}
          {formError && (
            <div style={{ marginTop: notice ? 12 : 0 }}>
              <Alert variant="error">{formError}</Alert>
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
            style={{ marginTop: notice || formError ? 20 : 0 }}
          >
            <Field label="Email" required error={errors.email}>
              {(aria) => (
                <input
                  {...aria}
                  ref={emailRef}
                  type="email"
                  className={`input ${errors.email ? 'input--invalid' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              )}
            </Field>

            <Field label="Password" required error={errors.password}>
              {(aria) => (
                <input
                  {...aria}
                  type="password"
                  className={`input ${errors.password ? 'input--invalid' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {locked ? `Try again in ${lockSeconds}s` : 'Log in'}
            </Button>
          </form>

          <p className="auth-hint">
            Seeded demo account: <code>test@example.com</code> /{' '}
            <code>password</code>
          </p>
        </div>
      </div>
    </div>
  )
}
