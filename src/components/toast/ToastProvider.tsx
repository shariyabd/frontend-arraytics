import { useCallback, useMemo, useRef, useState } from 'react'
import { IconAlert, IconCheck, IconClose } from '../Icon'
import { ToastContext, type Toast, type ToastKind } from './context'

const DURATION = 4500

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, kind, message }])
      window.setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  const success = useCallback((m: string) => push('success', m), [push])
  const error = useCallback((m: string) => push('error', m), [push])

  const value = useMemo(
    () => ({ push, success, error }),
    [push, success, error],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`} role="status">
            <span className="toast__icon">
              {t.kind === 'success' ? (
                <IconCheck size={18} />
              ) : (
                <IconAlert size={18} />
              )}
            </span>
            <span className="toast__msg">{t.message}</span>
            <button
              className="toast__close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <IconClose size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
