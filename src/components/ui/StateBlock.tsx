import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  description?: string
  variant?: 'default' | 'error'
  actions?: ReactNode
}

export function StateBlock({
  icon,
  title,
  description,
  variant = 'default',
  actions,
}: Props) {
  return (
    <div className={`state ${variant === 'error' ? 'state--error' : ''}`}>
      <div className="state__icon">{icon}</div>
      <h2 className="state__title">{title}</h2>
      {description && <p className="state__desc">{description}</p>}
      {actions && <div className="state__actions">{actions}</div>}
    </div>
  )
}

export function CenterLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="center-load" role="status">
      <span className="spinner spinner--lg" aria-hidden="true" />
      <span className="u-sr-only">{label}</span>
    </div>
  )
}
