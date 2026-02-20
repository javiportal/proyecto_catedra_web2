import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    direccion: '',
    dui: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validateField = (name, value, allData = formData) => {
    let error = ''
    
    switch (name) {
      case 'nombres':
      case 'apellidos':
      case 'direccion':
        if (!value.trim()) error = 'Este campo es obligatorio'
        break
      case 'telefono':
        if (!/^\d{4}-\d{4}$/.test(value) && !/^\d{8}$/.test(value)) {
          error = 'Formato inválido (Ej: 7777-7777)'
        }
        break
      case 'dui':
        if (!/^\d{8}-\d$/.test(value)) {
          error = 'Formato inválido (00000000-0)'
        }
        break
      case 'correo':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Correo electrónico inválido'
        }
        break
      case 'password':
        if (value.length < 6) {
          error = 'Mínimo 6 caracteres'
        }
        break
      case 'confirmPassword':
        if (value !== allData.password) {
          error = 'Las contraseñas no coinciden'
        }
        break
      default:
        break
    }
    
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user types if field was already touched
    if (touched[name]) {
      const error = validateField(name, value, { ...formData, [name]: value })
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields before submission
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })

    setErrors(newErrors)
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    if (Object.keys(newErrors).length > 0) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setLoading(true)

    try {
      await signUp({
        email: formData.correo,
        password: formData.password,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        direccion: formData.direccion,
        dui: formData.dui,
      })
      toast.success('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.')
      navigate('/login')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getInputClass = (fieldName) => {
    return `form-input ${touched[fieldName] && errors[fieldName] ? 'form-input-error' : ''}`
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <div className="auth-brand-icon">🎟️</div>
          <p className="auth-brand-logo">La <span>Cuponera</span></p>
        </div>

        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-sub">Regístrate y empieza a ahorrar hoy mismo</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombres</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass('nombres')}
                placeholder="Juan Carlos"
              />
              {touched.nombres && errors.nombres && <span className="form-error-text">{errors.nombres}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass('apellidos')}
                placeholder="Martínez López"
              />
              {touched.apellidos && errors.apellidos && <span className="form-error-text">{errors.apellidos}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass('telefono')}
                placeholder="7777-7777"
              />
              {touched.telefono && errors.telefono && <span className="form-error-text">{errors.telefono}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Número de DUI</label>
              <input
                type="text"
                name="dui"
                value={formData.dui}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass('dui')}
                placeholder="00000000-0"
              />
              {touched.dui && errors.dui && <span className="form-error-text">{errors.dui}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass('correo')}
              placeholder="tucorreo@ejemplo.com"
            />
            {touched.correo && errors.correo && <span className="form-error-text">{errors.correo}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass('direccion')}
              placeholder="Tu dirección completa"
            />
            {touched.direccion && errors.direccion && <span className="form-error-text">{errors.direccion}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass('password')}
                placeholder="Mínimo 6 caracteres"
              />
              {touched.password && errors.password && <span className="form-error-text">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass('confirmPassword')}
                placeholder="Repite tu contraseña"
              />
              {touched.confirmPassword && errors.confirmPassword && <span className="form-error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="form-link-subtle">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
