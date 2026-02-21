import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import OfertasPorRubroPage from "./pages/OfertasPorRubroPage.jsx";
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OfferDetailPage from './pages/OfferDetailPage'
import MyCouponsPage from './pages/MyCouponsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="ofertas-por-rubro" element={<OfertasPorRubroPage />} />
        <Route path="oferta/:id" element={<OfferDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
        <Route path="mis-cupones" element={
          <ProtectedRoute>
            <MyCouponsPage />
          </ProtectedRoute>
        } />
        <Route
          path="*"
          element={
            <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
              Ruta no encontrada.
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
