import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [detalleExtra, setDetalleExtra] = useState({ ofertas: 0, empleados: 0 })
  const [form, setForm] = useState({ nombre: '', codigo: '', direccion: '', telefono: '', correo: '', porcentaje_comision: 5 })
  const [errors, setErrors] = useState({})

  useEffect(() => { fetchEmpresas() }, [])

  const fetchEmpresas = async () => {
    const { data } = await supabase.from('empresas').select('*').order('nombre')
    setEmpresas(data || [])
    setLoading(false)
  }

  const verDetalle = async (emp) => {
    setDetalle(emp)
    const [ofertasRes, empleadosRes] = await Promise.all([
      supabase.from('ofertas').select('id', { count: 'exact', head: true }).eq('empresa_id', emp.id),
      supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('empresa_id', emp.id).eq('rol', 'empleado'),
    ])
    setDetalleExtra({
      ofertas: ofertasRes.count || 0,
      empleados: empleadosRes.count || 0,
    })
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.codigo.trim()) {
      e.codigo = 'Requerido'
    } else if (!/^[A-Z]{3}[0-9]{3}$/.test(form.codigo.trim().toUpperCase())) {
      e.codigo = 'Formato invalido: 3 letras y 3 numeros (ej. ABC123)'
    }
    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo invalido'
    if (!form.telefono.trim()) e.telefono = 'Requerido'
    if (form.porcentaje_comision < 0 || form.porcentaje_comision > 100) e.porcentaje_comision = 'Entre 0 y 100'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const payload = {
      ...form,
      codigo: form.codigo.trim().toUpperCase(),
    }

    try {
      if (editing) {
        const { error } = await supabase.from('empresas').update(payload).eq('id', editing)
        if (error) throw error
        toast.success('Empresa actualizada')
      } else {
        const { error } = await supabase.from('empresas').insert(payload)
        if (error) throw error
        toast.success('Empresa creada')
      }
      resetForm()
      fetchEmpresas()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleEdit = (emp) => {
    setForm({ nombre: emp.nombre, codigo: emp.codigo, direccion: emp.direccion || '', telefono: emp.telefono || '', correo: emp.correo || '', porcentaje_comision: emp.porcentaje_comision || 5 })
    setEditing(emp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta empresa?')) return
    const { error } = await supabase.from('empresas').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Empresa eliminada')
      fetchEmpresas()
    }
  }

  const resetForm = () => {
    setForm({ nombre: '', codigo: '', direccion: '', telefono: '', correo: '', porcentaje_comision: 5 })
    setEditing(null)
    setShowForm(false)
    setErrors({})
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Gestion de Empresas</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Cancelar' : '+ Nueva Empresa'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">{editing ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className={`form-input ${errors.nombre ? 'form-input-error' : ''}`} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              {errors.nombre && <span className="form-error-text">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Codigo</label>
              <input className={`form-input ${errors.codigo ? 'form-input-error' : ''}`} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} maxLength={6} placeholder="Ej: ABC123" />
              {errors.codigo && <span className="form-error-text">{errors.codigo}</span>}
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input type="email" className={`form-input ${errors.correo ? 'form-input-error' : ''}`} value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
              {errors.correo && <span className="form-error-text">{errors.correo}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Telefono</label>
              <input className={`form-input ${errors.telefono ? 'form-input-error' : ''}`} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              {errors.telefono && <span className="form-error-text">{errors.telefono}</span>}
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Direccion</label>
              <input className="form-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Comision (%)</label>
              <input type="number" min="0" max="100" className={`form-input ${errors.porcentaje_comision ? 'form-input-error' : ''}`} value={form.porcentaje_comision} onChange={e => setForm({ ...form, porcentaje_comision: Number(e.target.value) })} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>{editing ? 'Guardar Cambios' : 'Crear Empresa'}</button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Codigo</th><th>Correo</th><th>Telefono</th><th>Comision</th><th>Acciones</th></tr>
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
            {empresas.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-muted">No hay empresas registradas.</td></tr>}
          </tbody>
        </table>
      </div>

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
                <div className="detail-value">{detalle.created_at ? new Date(detalle.created_at).toLocaleDateString('es-SV') : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
