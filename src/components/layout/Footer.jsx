import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand-name">La <span>Cuponera</span></p>
          <p className="footer-tagline">
            Las mejores ofertas y cupones de descuento en un solo lugar.
          </p>
        </div>

        <div>
          <p className="footer-heading">Navegación</p>
          <Link to="/" className="footer-link">Ofertas activas</Link>
          <Link to="/login" className="footer-link">Iniciar sesión</Link>
          <Link to="/registro" className="footer-link">Crear cuenta</Link>
          <Link to="/mis-cupones" className="footer-link">Mis cupones</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">
          © {year} Cuartel General
        </span>
        <span className="footer-copy">El Salvador - ESEN </span>
      </div>
    </footer>
  )
}
