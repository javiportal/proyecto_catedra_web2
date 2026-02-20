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
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🎟️</span>
          La <span className="nav-logo-accent">Cuponera</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Ofertas</Link>

          {user ? (
            <>
              <Link to="/mis-cupones" className="nav-link">Mis Cupones</Link>
              <Link to="/cambiar-password" className="nav-link">Contraseña</Link>
              <span className="nav-user">{profile?.nombres || user.email}</span>
              <button onClick={handleSignOut} className="btn-nav-danger">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
              <Link to="/registro" className="btn-nav-cta">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
