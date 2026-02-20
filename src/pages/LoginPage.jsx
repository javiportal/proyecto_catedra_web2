import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn({ email, password })
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">🎟️</div>
          <p className="auth-brand-logo">La <span>Cuponera</span></p>
        </div>

        <h1 className="auth-title">Iniciar Sesión</h1>
        <p className="auth-sub">Accede a tu cuenta para ver tus cupones</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px', marginTop: '-6px' }}>
            <Link to="/forgot-password" className="form-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="form-link-subtle">
          ¿No tienes cuenta?{' '}
          <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}
