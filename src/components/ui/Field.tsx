import { useId } from 'react'
import { IconAlert } from '../Icon'

interface FieldProps {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  hint?: string

  children: (aria: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => React.ReactNode
}

export function Field({
  label,
  required,
  optional,
  error,
  hint,
  children,
}: FieldProps) {
  const id = useId()
  const errId = `${id}-err`
  const hintId = `${id}-hint`
  const describedBy =
    [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="field__optional">(optional)</span>}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <p className="field__error" id={errId} role={error ? 'alert' : undefined}>
        {error && (
          <>
            <IconAlert size={13} />
            {error}
          </>
        )}
      </p>
    </div>
  )
}
