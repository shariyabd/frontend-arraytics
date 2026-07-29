import { createContext } from 'react'

export type ToastKind = 'success' | 'error'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

export interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
