import type { ButtonHTMLAttributes, Ref } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-ghost'
type Size = 'md' | 'sm' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  ref?: Ref<HTMLButtonElement>
}

const variantClass: Record<Variant, string> = {
  primary: 'btn--primary',
  secondary: '',
  danger: 'btn--danger',
  ghost: 'btn--ghost',
  'danger-ghost': 'btn--danger-ghost',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  block = false,
  className = '',
  disabled,
  children,
  type = 'button',
  ...rest
}: Props) {
  const classes = [
    'btn',
    variantClass[variant],
    size === 'sm' ? 'btn--sm' : '',
    size === 'icon' ? 'btn--icon' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
