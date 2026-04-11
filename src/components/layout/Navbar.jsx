import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  const goToNewCoupon = () => {
    closeMenu()
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
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          La <span className="nav-logo-accent">Cuponera</span>
        </Link>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Ofertas</Link>
          <Link to="/ofertas-por-rubro" className="nav-link" onClick={closeMenu}>Por Rubro</Link>
          <button onClick={goToNewCoupon} className="nav-link">Nuevo Cupon</button>

          {user ? (
            <>
              {role === 'cliente' && <Link to="/mis-cupones" className="nav-link" onClick={closeMenu}>Mis Cupones</Link>}
              {role === 'admin' && (
                <>
                  <Link to="/admin/empresas" className="nav-link" onClick={closeMenu}>Empresas</Link>
                  <Link to="/admin/empleados" className="nav-link" onClick={closeMenu}>Empleados</Link>
                  <Link to="/admin/clientes" className="nav-link" onClick={closeMenu}>Clientes</Link>
                  <Link to="/admin/rubros" className="nav-link" onClick={closeMenu}>Rubros</Link>
                  <Link to="/admin/ofertas" className="nav-link" onClick={closeMenu}>Ofertas</Link>
                  <Link to="/admin/cupones" className="nav-link" onClick={closeMenu}>Cupones</Link>
                </>
              )}
              {role === 'empresa' && <Link to="/empresa/ofertas" className="nav-link" onClick={closeMenu}>Mis Ofertas</Link>}
              {role === 'empleado' && <Link to="/empleado/canjear" className="nav-link" onClick={closeMenu}>Canjear Cupon</Link>}
              <span className="nav-user">{profile?.nombres || profile?.nombre || user.email}</span>
              <button onClick={handleSignOut} className="btn-nav-danger">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Iniciar Sesion</Link>
              <Link to="/registro" className="btn-nav-cta" onClick={closeMenu}>Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
