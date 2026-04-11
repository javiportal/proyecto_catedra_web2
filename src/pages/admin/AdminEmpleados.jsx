import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminEmpleados() {
  const [empleados, setEmpleados] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    empresa_id: '',
  })

  useEffect(() => {
    fetchEmpleados()
    fetchEmpresas()
  }, [])

  const fetchEmpresas = async () => {
    const { data } = await supabase.from('empresas').select('id, nombre').order('nombre')
    setEmpresas(data || [])
  }

  const fetchEmpleados = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('*, empresas(nombre)')
      .eq('rol', 'empleado')
      .order('nombre')
    setEmpleados(data || [])
    setLoading(false)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.empresa_id) e.empresa_id = 'Selecciona una empresa'
    if (!editing) {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = 'Correo invalido'
      if (!form.password || form.password.length < 6)
        e.password = 'Minimo 6 caracteres'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)

    try {
      if (editing) {
        const { error } = await supabase
          .from('usuarios')
          .update({ nombre: form.nombre, empresa_id: form.empresa_id })
          .eq('id', editing)
        if (error) throw error
        toast.success('Empleado actualizado')
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })
        if (authError) throw authError

        const { error: profileError } = await supabase.from('usuarios').insert({
          user_id: authData.user.id,
          nombre: form.nombre,
          rol: 'empleado',
          empresa_id: form.empresa_id,
        })
        if (profileError) throw profileError
        toast.success('Empleado creado')
      }
      resetForm()
      fetchEmpleados()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (emp) => {
    setForm({
      email: '',
      password: '',
      nombre: emp.nombre || '',
      empresa_id: emp.empresa_id || '',
    })
    setEditing(emp.id)
    setShowForm(true)
    setErrors({})
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este empleado?')) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Empleado eliminado')
      fetchEmpleados()
    }
  }

  const resetForm = () => {
    setForm({ email: '', password: '', nombre: '', empresa_id: '' })
    setEditing(null)
    setShowForm(false)
    setErrors({})
  }

  const filtered = empleados.filter(e =>
    `${e.nombre} ${e.empresas?.nombre}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Gestion de Empleados</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Cancelar' : '+ Nuevo Empleado'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">{editing ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>

          {!editing && (
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Correo Electronico</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="empleado@correo.com"
                />
                {errors.email && <span className="form-error-text">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Contrasena</label>
                <input
                  type="password"
                  className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimo 6 caracteres"
                />
                {errors.password && <span className="form-error-text">{errors.password}</span>}
              </div>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input
                className={`form-input ${errors.nombre ? 'form-input-error' : ''}`}
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre del empleado"
              />
              {errors.nombre && <span className="form-error-text">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select
                className={`form-input ${errors.empresa_id ? 'form-input-error' : ''}`}
                value={form.empresa_id}
                onChange={e => setForm({ ...form, empresa_id: e.target.value })}
              >
                <option value="">Seleccionar empresa...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
              {errors.empresa_id && <span className="form-error-text">{errors.empresa_id}</span>}
            </div>
          </div>

          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Empleado'}
          </button>
        </div>
      )}

      <input
        className="form-input mb-6"
        placeholder="Buscar por nombre o empresa..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 400 }}
      />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id}>
                <td className="font-semibold">{emp.nombre}</td>
                <td>{emp.empresas?.nombre || 'Sin empresa'}</td>
                <td><span className="admin-status-badge aprobada">Empleado</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-sm btn-edit" onClick={() => handleEdit(emp)}>Editar</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(emp.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-muted">No hay empleados registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
