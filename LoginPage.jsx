import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { signIn, role, user } = useAuth()
  const navigate = useNavigate()

  // Redirect when role is known after login
  useEffect(() => {
    if (user && role) {
      const routes = { admin: '/admin/ofertas', empresa: '/empresa/ofertas', empleado: '/empleado/canjear', cliente: '/' }
      navigate(routes[role] || '/')
    }
  }, [user, role])

  const validate = () => {
    const e = {}
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo inválido'
    if (!password || password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await signIn({ email, password })
      toast.success('¡Bienvenido!')
    } catch (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message
      )
    } finally { setLoading(false) }
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
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`form-input ${errors.email ? 'form-input-error' : ''}`} placeholder="tucorreo@ejemplo.com" />
            {errors.email && <span className="form-error-text">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={`form-input ${errors.password ? 'form-input-error' : ''}`} placeholder="••••••••" />
            {errors.password && <span className="form-error-text">{errors.password}</span>}
          </div>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="form-link-subtle">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}
