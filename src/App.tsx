import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { ToastProvider } from './components/toast/ToastProvider'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { ContactsListPage } from './pages/ContactsListPage'
import { ContactDetailsPage } from './pages/ContactDetailsPage'
import { ContactCreatePage } from './pages/ContactCreatePage'
import { ContactEditPage } from './pages/ContactEditPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

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
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
