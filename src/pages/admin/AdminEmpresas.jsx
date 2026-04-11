import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import './AdminEmpresas.css'
import {
  fetchEmpresas,
  fetchEmpresaStats,
  insertEmpresa,
  updateEmpresa,
  deleteEmpresa,
  createEmpresaUser,
} from '../../services/empresasService'

// ─── validation ──────────────────────────────────────────────
function validateEmpresaForm(form) {
  const e = {}
  if (!form.nombre.trim()) e.nombre = 'Requerido'
  if (!form.codigo.trim()) {
    e.codigo = 'Requerido'
  } else if (!/^[A-Z]{3}[0-9]{3}$/.test(form.codigo.trim().toUpperCase())) {
    e.codigo = 'Formato invalido: 3 letras y 3 numeros (ej. ABC123)'
  }
  if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
    e.correo = 'Correo invalido'
  if (!form.telefono.trim()) e.telefono = 'Requerido'
  if (form.porcentaje_comision < 0 || form.porcentaje_comision > 100)
    e.porcentaje_comision = 'Entre 0 y 100'
  return e
}

function validateEmpresaUserForm(form) {
  const e = {}
  if (!form.nombre.trim()) e.nombre = 'Requerido'
  if (!form.empresa_id) e.empresa_id = 'Selecciona una empresa'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo invalido'
  if (!form.password || form.password.length < 6)
    e.password = 'Minimo 6 caracteres'
  return e
}

const EMPTY_EMPRESA = {
  nombre: '',
  codigo: '',
  direccion: '',
  telefono: '',
  correo: '',
  porcentaje_comision: 5,
}

const EMPTY_USER_FORM = { email: '', password: '', nombre: '', empresa_id: '' }

// ─── component ───────────────────────────────────────────────
export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)

  // empresa CRUD form
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_EMPRESA)
  const [errors, setErrors] = useState({})

  // detail modal
  const [detalle, setDetalle] = useState(null)
  const [detalleExtra, setDetalleExtra] = useState({ ofertas: 0, empleados: 0 })

  // empresa-user creation form
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)
  const [userErrors, setUserErrors] = useState({})
  const [savingUser, setSavingUser] = useState(false)

  useEffect(() => { loadEmpresas() }, [])

  const loadEmpresas = async () => {
    try {
      const data = await fetchEmpresas()
      setEmpresas(data)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── detail modal ────────────────────────────────────────────
  const verDetalle = async (emp) => {
    setDetalle(emp)
    try {
      const stats = await fetchEmpresaStats(emp.id)
      setDetalleExtra(stats)
    } catch {
      setDetalleExtra({ ofertas: 0, empleados: 0 })
    }
  }

  // ── empresa CRUD ────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validateEmpresaForm(form)
    setErrors(e)
    if (Object.keys(e).length > 0) return

    const payload = { ...form, codigo: form.codigo.trim().toUpperCase() }

    try {
      if (editing) {
        await updateEmpresa(editing, payload)
        toast.success('Empresa actualizada')
      } else {
        await insertEmpresa(payload)
        toast.success('Empresa creada')
      }
      resetForm()
      loadEmpresas()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleEdit = (emp) => {
    setForm({
      nombre: emp.nombre,
      codigo: emp.codigo,
      direccion: emp.direccion || '',
      telefono: emp.telefono || '',
      correo: emp.correo || '',
      porcentaje_comision: emp.porcentaje_comision || 5,
    })
    setEditing(emp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta empresa?')) return
    try {
      await deleteEmpresa(id)
      toast.success('Empresa eliminada')
      loadEmpresas()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const resetForm = () => {
    setForm(EMPTY_EMPRESA)
    setEditing(null)
    setShowForm(false)
    setErrors({})
  }

  // ── empresa-user creation ────────────────────────────────────
  const handleCreateUser = async () => {
    const e = validateEmpresaUserForm(userForm)
    setUserErrors(e)
    if (Object.keys(e).length > 0) return

    setSavingUser(true)
    try {
      await createEmpresaUser(
        userForm.email,
        userForm.password,
        userForm.nombre,
        userForm.empresa_id,
      )
      toast.success(
        'Cuenta empresa creada. Si la confirmacion de correo esta activa, el usuario debe verificar su email antes de iniciar sesion.',
      )
      setUserForm(EMPTY_USER_FORM)
      setUserErrors({})
      setShowUserForm(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingUser(false)
    }
  }

  const resetUserForm = () => {
    setUserForm(EMPTY_USER_FORM)
    setUserErrors({})
    setShowUserForm(false)
  }

  // ── render ───────────────────────────────────────────────────
  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      {/* ── header ── */}
      <div className="admin-header">
        <h1 className="admin-title">Gestion de Empresas</h1>
        <div className="admin-empresas-header-actions">
          <button
            className="btn-secondary"
            onClick={() => { resetUserForm(); setShowUserForm(!showUserForm) }}
          >
            {showUserForm ? 'Cancelar cuenta' : '+ Cuenta empresa'}
          </button>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowForm(!showForm) }}
          >
            {showForm ? 'Cancelar' : '+ Nueva Empresa'}
          </button>
        </div>
      </div>

      {/* ── empresa CRUD form ── */}
      {showForm && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">{editing ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                className={`form-input ${errors.nombre ? 'form-input-error' : ''}`}
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
              {errors.nombre && <span className="form-error-text">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Codigo</label>
              <input
                className={`form-input ${errors.codigo ? 'form-input-error' : ''}`}
                value={form.codigo}
                onChange={e =>
                  setForm({ ...form, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })
                }
                maxLength={6}
                placeholder="Ej: ABC123"
              />
              {errors.codigo && <span className="form-error-text">{errors.codigo}</span>}
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                type="email"
                className={`form-input ${errors.correo ? 'form-input-error' : ''}`}
                value={form.correo}
                onChange={e => setForm({ ...form, correo: e.target.value })}
              />
              {errors.correo && <span className="form-error-text">{errors.correo}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Telefono</label>
              <input
                className={`form-input ${errors.telefono ? 'form-input-error' : ''}`}
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
              />
              {errors.telefono && <span className="form-error-text">{errors.telefono}</span>}
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Direccion</label>
              <input
                className="form-input"
                value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Comision (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className={`form-input ${errors.porcentaje_comision ? 'form-input-error' : ''}`}
                value={form.porcentaje_comision}
                onChange={e => setForm({ ...form, porcentaje_comision: Number(e.target.value) })}
              />
              {errors.porcentaje_comision && (
                <span className="form-error-text">{errors.porcentaje_comision}</span>
              )}
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>
            {editing ? 'Guardar Cambios' : 'Crear Empresa'}
          </button>
        </div>
      )}

      {/* ── empresa-user creation form ── */}
      {showUserForm && (
        <div className="admin-form-card admin-empresas-user-form">
          <h2 className="admin-form-title">Crear Cuenta de Acceso para Empresa</h2>
          <p className="admin-empresas-user-form-hint">
            Esta cuenta permite que el administrador de una empresa inicie sesion y gestione
            sus propias ofertas. Asocia el usuario a una empresa ya registrada.
          </p>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombre del usuario</label>
              <input
                className={`form-input ${userErrors.nombre ? 'form-input-error' : ''}`}
                value={userForm.nombre}
                onChange={e => setUserForm({ ...userForm, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
              {userErrors.nombre && <span className="form-error-text">{userErrors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select
                className={`form-input ${userErrors.empresa_id ? 'form-input-error' : ''}`}
                value={userForm.empresa_id}
                onChange={e => setUserForm({ ...userForm, empresa_id: e.target.value })}
              >
                <option value="">Seleccionar empresa...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
              {userErrors.empresa_id && (
                <span className="form-error-text">{userErrors.empresa_id}</span>
              )}
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Correo electronico</label>
              <input
                type="email"
                className={`form-input ${userErrors.email ? 'form-input-error' : ''}`}
                value={userForm.email}
                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="empresa@correo.com"
              />
              {userErrors.email && <span className="form-error-text">{userErrors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Contrasena</label>
              <input
                type="password"
                className={`form-input ${userErrors.password ? 'form-input-error' : ''}`}
                value={userForm.password}
                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Minimo 6 caracteres"
              />
              {userErrors.password && (
                <span className="form-error-text">{userErrors.password}</span>
              )}
            </div>
          </div>
          <button className="btn-primary" onClick={handleCreateUser} disabled={savingUser}>
            {savingUser ? 'Creando...' : 'Crear Cuenta Empresa'}
          </button>
        </div>
      )}

      {/* ── table ── */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Codigo</th>
              <th>Correo</th>
              <th>Telefono</th>
              <th>Comision</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.id}>
                <td className="font-semibold">{emp.nombre}</td>
                <td><span className="badge-code">{emp.codigo}</span></td>
                <td>{emp.correo}</td>
                <td>{emp.telefono}</td>
                <td>{emp.porcentaje_comision}%</td>
                <td>
                  <div className="table-actions">
                    <button className="btn-sm btn-edit" onClick={() => verDetalle(emp)}>Ver</button>
                    <button className="btn-sm btn-edit" onClick={() => handleEdit(emp)}>Editar</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(emp.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-muted">
                  No hay empresas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── detail modal ── */}
      {detalle && (
        <div className="detail-overlay" onClick={() => setDetalle(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setDetalle(null)}>&times;</button>
            <h2 className="detail-title">{detalle.nombre}</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-label">Codigo</div>
                <div className="detail-value"><span className="badge-code">{detalle.codigo}</span></div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Correo</div>
                <div className="detail-value">{detalle.correo || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Telefono</div>
                <div className="detail-value">{detalle.telefono || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Direccion</div>
                <div className="detail-value">{detalle.direccion || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Comision</div>
                <div className="detail-value">{detalle.porcentaje_comision}%</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Total Ofertas</div>
                <div className="detail-value">{detalleExtra.ofertas}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Total Empleados</div>
                <div className="detail-value">{detalleExtra.empleados}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Registrada</div>
                <div className="detail-value">
                  {detalle.created_at
                    ? new Date(detalle.created_at).toLocaleDateString('es-SV')
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
