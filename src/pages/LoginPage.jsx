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

  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!email.trim()) newErrors.email = 'Ingresa tu correo o usuario'
    if (!password) newErrors.password = 'Ingresa tu contrasena'
    else if (password.length < 6 && email.trim().toLowerCase() !== 'admin')
      newErrors.password = 'Minimo 6 caracteres'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)

    try {
      const result = await signIn({ email, password })
      toast.success('¡Bienvenido!')

      if (result?.role === 'admin') {
        navigate('/admin/cupones')
      } else if (result?.role === 'empresa') {
        navigate('/empresa/ofertas')
      } else if (result?.role === 'empleado') {
        navigate('/empleado/canjear')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Usuario/correo o contraseña incorrectos'
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
        <p className="auth-sub">Accede a tu cuenta para ver tus cupones o al panel admin</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo o usuario</label>
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })) }}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="tucorreo@ejemplo.com o admin"
            />
            {errors.email && <span className="form-error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })) }}
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && <span className="form-error-text">{errors.password}</span>}
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="form-link-subtle">
          ¿No tienes cuenta?{' '}
          <Link to="/registro">Regístrate aquí</Link>
        </p>
        <p className="form-link-subtle" style={{ marginTop: 8 }}>
          Acceso rápido admin: usuario <strong>admin</strong> y contraseña <strong>admin123</strong>
        </p>
      </div>
    </div>
  )
}

