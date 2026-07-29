import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { CenterLoader } from '../components/ui/StateBlock'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <CenterLoader label="Restoring session…" />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
