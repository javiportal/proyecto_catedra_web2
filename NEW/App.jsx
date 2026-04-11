import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OfferDetailPage from './pages/OfferDetailPage'
import MyCouponsPage from './pages/MyCouponsPage'
import AdminEmpresas from './pages/admin/AdminEmpresas'
import AdminClientes from './pages/admin/AdminClientes'
import AdminRubros from './pages/admin/AdminRubros'
import AdminOfertas from './pages/admin/AdminOfertas'
import EmpresaOfertas from './pages/empresa/EmpresaOfertas'
import CanjearCupon from './pages/empleado/CanjearCupon'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="oferta/:id" element={<OfferDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />

        {/* Cliente */}
        <Route path="mis-cupones" element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <MyCouponsPage />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="admin/empresas" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEmpresas />
          </ProtectedRoute>
        } />
        <Route path="admin/clientes" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminClientes />
          </ProtectedRoute>
        } />
        <Route path="admin/rubros" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRubros />
          </ProtectedRoute>
        } />
        <Route path="admin/ofertas" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOfertas />
          </ProtectedRoute>
        } />

        {/* Empresa */}
        <Route path="empresa/ofertas" element={
          <ProtectedRoute allowedRoles={['empresa']}>
            <EmpresaOfertas />
          </ProtectedRoute>
        } />

        {/* Empleado */}
        <Route path="empleado/canjear" element={
          <ProtectedRoute allowedRoles={['empleado']}>
            <CanjearCupon />
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
            Ruta no encontrada.
          </div>
        } />
      </Route>
    </Routes>
  )
}
