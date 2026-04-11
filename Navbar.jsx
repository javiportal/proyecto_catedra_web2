import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          La <span className="nav-logo-accent">Cuponera</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Ofertas</Link>

          {user ? (
            <>
              {role === 'cliente' && (
                <Link to="/mis-cupones" className="nav-link">Mis Cupones</Link>
              )}
              {role === 'admin' && (
                <>
                  <Link to="/admin/empresas" className="nav-link">Empresas</Link>
                  <Link to="/admin/clientes" className="nav-link">Clientes</Link>
                  <Link to="/admin/rubros" className="nav-link">Rubros</Link>
                  <Link to="/admin/ofertas" className="nav-link">Ofertas</Link>
                </>
              )}
              {role === 'empresa' && (
                <Link to="/empresa/ofertas" className="nav-link">Mis Ofertas</Link>
              )}
              {role === 'empleado' && (
                <Link to="/empleado/canjear" className="nav-link">Canjear Cupón</Link>
              )}
              <span className="nav-user">
                {role === 'cliente' ? (profile?.nombres || user.email) : (profile?.nombre || user.email)}
                {role && role !== 'cliente' && (
                  <span style={{ fontSize: '0.6rem', marginLeft: 6, opacity: 0.6, textTransform: 'uppercase' }}>
                    {role}
                  </span>
                )}
              </span>
              <button onClick={handleSignOut} className="btn-nav-danger">Salir</button>
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
