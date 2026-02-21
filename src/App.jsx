import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import OfertasPorRubroPage from "./pages/OfertasPorRubroPage.jsx";
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import OfferDetailPage from './pages/OfferDetailPage'
import MyCouponsPage from './pages/MyCouponsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route path="/ofertas-por-rubro" element={<OfertasPorRubroPage />} />
            <Route index element={<HomePage />} />
            <Route path="oferta/:id" element={<OfferDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="cambiar-password" element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="mis-cupones" element={
          <ProtectedRoute>
            <MyCouponsPage />
          </ProtectedRoute>
        } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}