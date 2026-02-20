import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎟️</span>
            <span className="text-xl font-bold text-blue-700">La Cuponera</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Ofertas
            </Link>

            {user ? (
              <>
                <Link to="/mis-cupones" className="text-gray-600 hover:text-blue-600">
                  Mis Cupones
                </Link>
                <Link to="/cambiar-password" className="text-gray-600 hover:text-blue-600">
                  Cambiar Contraseña
                </Link>
                <span className="text-sm text-gray-500">
                  {profile?.nombres || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600">
                  Iniciar Sesión
                </Link>
                <Link
                  to="/registro"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}