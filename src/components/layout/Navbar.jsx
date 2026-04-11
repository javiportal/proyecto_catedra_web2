import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const goToNewCoupon = () => {
    if (role === 'admin') {
      navigate('/admin/cupones?nuevo=1')
      return
    }

    toast('Para crear un nuevo cupon, inicia sesion como admin')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          La <span className="nav-logo-accent">Cuponera</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Ofertas</Link>
          <button onClick={goToNewCoupon} className="nav-link">Nuevo Cupon</button>

          {user ? (
            <>
              {role === 'cliente' && <Link to="/mis-cupones" className="nav-link">Mis Cupones</Link>}
              {role === 'admin' && (
                <>
                  <Link to="/admin/empresas" className="nav-link">Empresas</Link>
                  <Link to="/admin/clientes" className="nav-link">Clientes</Link>
                  <Link to="/admin/rubros" className="nav-link">Rubros</Link>
                  <Link to="/admin/ofertas" className="nav-link">Ofertas</Link>
                  <Link to="/admin/cupones" className="nav-link">Cupones</Link>
                </>
              )}
              {role === 'empresa' && <Link to="/empresa/ofertas" className="nav-link">Mis Ofertas</Link>}
              {role === 'empleado' && <Link to="/empleado/canjear" className="nav-link">Canjear Cupón</Link>}
              <span className="nav-user">{profile?.nombres || profile?.nombre || user.email}</span>
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
