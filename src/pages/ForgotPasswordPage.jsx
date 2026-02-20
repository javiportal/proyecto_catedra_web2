import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Correo de recuperación enviado')
    } catch (error) {
      toast.error(error.message)
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

        <h1 className="auth-title">Recuperar Contraseña</h1>
        <p className="auth-sub">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="success-card">
            <div className="success-icon">✉️</div>
            <p className="success-title">¡Correo enviado!</p>
            <p className="success-text">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/login" className="form-link">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
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

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <p className="form-link-subtle">
              <Link to="/login" className="form-link">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
