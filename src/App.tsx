import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { ToastProvider } from './components/toast/ToastProvider'
import { Layout } from './components/Layout'
import { CenterLoader } from './components/ui/StateBlock'
import './App.css'

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ContactsListPage = lazy(() =>
  import('./pages/ContactsListPage').then((m) => ({
    default: m.ContactsListPage,
  })),
)
const ContactDetailsPage = lazy(() =>
  import('./pages/ContactDetailsPage').then((m) => ({
    default: m.ContactDetailsPage,
  })),
)
const ContactCreatePage = lazy(() =>
  import('./pages/ContactCreatePage').then((m) => ({
    default: m.ContactCreatePage,
  })),
)
const ContactEditPage = lazy(() =>
  import('./pages/ContactEditPage').then((m) => ({
    default: m.ContactEditPage,
  })),
)

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<CenterLoader label="Loading…" />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                  <Route index element={<Navigate to="/contacts" replace />} />
                  <Route path="contacts" element={<ContactsListPage />} />
                  <Route path="contacts/new" element={<ContactCreatePage />} />
                  <Route path="contacts/:id" element={<ContactDetailsPage />} />
                  <Route
                    path="contacts/:id/edit"
                    element={<ContactEditPage />}
                  />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/contacts" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
