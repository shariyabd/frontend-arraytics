import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useToast } from './toast/useToast'
import { Button } from './ui/Button'
import { IconBook, IconLogout } from './Icon'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function Layout() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    toast.success('You have been logged out.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/contacts" className="brand">
          <span className="brand__mark">
            <IconBook size={17} />
          </span>
          Address Book
        </Link>

        <div className="account" ref={menuRef}>
          <button
            className="account__btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="avatar">{initials(user?.name ?? '?')}</span>
          </button>
          {menuOpen && (
            <div className="account__menu" role="menu">
              <div className="account__id">
                <b>{user?.name}</b>
                <span>{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                block
                onClick={handleLogout}
                loading={loggingOut}
                style={{ justifyContent: 'flex-start' }}
              >
                <IconLogout size={16} />
                Log out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
