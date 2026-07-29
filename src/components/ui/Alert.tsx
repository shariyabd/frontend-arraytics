import type { ReactNode } from 'react'
import { IconAlert } from '../Icon'

interface Props {
  variant?: 'error' | 'warning'
  children: ReactNode
}

export function Alert({ variant = 'error', children }: Props) {
  return (
    <div className={`alert alert--${variant}`} role="alert">
      <span className="alert__icon">
        <IconAlert size={16} />
      </span>
      <span>{children}</span>
    </div>
  )
}
