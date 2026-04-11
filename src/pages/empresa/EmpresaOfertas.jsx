import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function EmpresaOfertas() {
  const { empresaId } = useAuth()
  const [ofertas, setOfertas] = useState([])
  const [rubros, setRubros] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const emptyForm = { titulo: '', descripcion: '', precio_regular: '', precio_oferta: '', fecha_inicio: '', fecha_fin: '', fecha_limite_cupon: '', rubro_id: '', cantidad_limite: '', otros_detalles: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (empresaId) {
      fetchOfertas()
      fetchRubros()
    }
  }, [empresaId])

  const fetchOfertas = async () => {
    const { data } = await supabase.from('ofertas').select('*, rubros(nombre)')
      .eq('empresa_id', empresaId).order('created_at', { ascending: false })
    setOfertas(data || [])
    setLoading(false)
  }

  const fetchRubros = async () => {
    const { data } = await supabase.from('rubros').select('*').order('nombre')
    setRubros(data || [])
  }

  const validate = () => {
    const e = {}
    if (!form.titulo.trim()) e.titulo = 'Requerido'
    if (!form.descripcion.trim()) e.descripcion = 'Requerido'
    if (!form.precio_regular || Number(form.precio_regular) <= 0) e.precio_regular = 'Debe ser mayor a 0'
    if (!form.precio_oferta || Number(form.precio_oferta) <= 0) e.precio_oferta = 'Debe ser mayor a 0'
    if (Number(form.precio_oferta) >= Number(form.precio_regular)) e.precio_oferta = 'Debe ser menor al precio regular'
    if (!form.fecha_inicio) e.fecha_inicio = 'Requerido'
    if (!form.fecha_fin) e.fecha_fin = 'Requerido'
    if (!form.fecha_limite_cupon) e.fecha_limite_cupon = 'Requerido'
    if (!form.rubro_id) e.rubro_id = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const payload = {
      ...form,
      empresa_id: empresaId,
      precio_regular: Number(form.precio_regular),
      precio_oferta: Number(form.precio_oferta),
      rubro_id: Number(form.rubro_id),
      cantidad_limite: form.cantidad_limite ? Number(form.cantidad_limite) : null,
      estado: 'PENDIENTE',
    }
    try {
      if (editing) {
        delete payload.estado
        const { error } = await supabase.from('ofertas').update(payload).eq('id', editing)
        if (error) throw error
        toast.success('Oferta actualizada')
      } else {
        const { error } = await supabase.from('ofertas').insert(payload)
        if (error) throw error
        toast.success('Oferta creada (pendiente de aprobacion)')
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchOfertas()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleEdit = (o) => {
    setForm({ titulo: o.titulo, descripcion: o.descripcion || '', precio_regular: o.precio_regular, precio_oferta: o.precio_oferta, fecha_inicio: o.fecha_inicio || '', fecha_fin: o.fecha_fin || '', fecha_limite_cupon: o.fecha_limite_cupon || '', rubro_id: o.rubro_id || '', cantidad_limite: o.cantidad_limite || '', otros_detalles: o.otros_detalles || '' })
    setEditing(o.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta oferta?')) return
    const { error } = await supabase.from('ofertas').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Oferta eliminada')
      fetchOfertas()
    }
  }

  const F = ({ label, name, type = 'text', ...props }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'textarea' ? (
        <textarea className={`form-input ${errors[name] ? 'form-input-error' : ''}`} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} rows={3} {...props} />
      ) : type === 'select' ? (
        <select className={`form-input ${errors[name] ? 'form-input-error' : ''}`} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} {...props}>
          <option value="">Seleccionar...</option>
          {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      ) : (
        <input type={type} className={`form-input ${errors[name] ? 'form-input-error' : ''}`} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} {...props} />
      )}
      {errors[name] && <span className="form-error-text">{errors[name]}</span>}
    </div>
  )

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Mis Ofertas</h1>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(!showForm); setErrors({}) }}>
          {showForm ? 'Cancelar' : '+ Nueva Oferta'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">{editing ? 'Editar Oferta' : 'Nueva Oferta'}</h2>
          <F label="Titulo" name="titulo" />
          <F label="Descripcion" name="descripcion" type="textarea" />
          <div className="form-grid-2">
            <F label="Precio Regular ($)" name="precio_regular" type="number" min="0" step="0.01" />
            <F label="Precio Oferta ($)" name="precio_oferta" type="number" min="0" step="0.01" />
          </div>
          <div className="form-grid-2">
            <F label="Fecha Inicio" name="fecha_inicio" type="date" />
            <F label="Fecha Fin" name="fecha_fin" type="date" />
          </div>
          <div className="form-grid-2">
            <F label="Fecha Limite Cupon" name="fecha_limite_cupon" type="date" />
            <F label="Rubro" name="rubro_id" type="select" />
          </div>
          <div className="form-grid-2">
            <F label="Cantidad Limite (vacio = ilimitado)" name="cantidad_limite" type="number" min="1" />
            <F label="Otros Detalles" name="otros_detalles" />
          </div>
          <button className="btn-primary" onClick={handleSubmit}>{editing ? 'Guardar Cambios' : 'Crear Oferta'}</button>
        </div>
      )}

      <div className="space-y-4">
        {ofertas.map(o => (
          <div key={o.id} className="admin-offer-card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-main">{o.titulo}</h3>
                <p className="text-sm text-muted">{o.rubros?.nombre}</p>
              </div>
              <span className={`admin-status-badge ${(o.estado || '').toLowerCase()}`}>{o.estado}</span>
            </div>
            <p className="text-sm text-muted mb-2">{o.descripcion}</p>
            <div className="flex gap-3 text-sm text-muted mb-3">
              <span>Regular: ${o.precio_regular}</span>
              <span>Oferta: <strong className="text-gold">${o.precio_oferta}</strong></span>
              <span>{o.fecha_inicio} - {o.fecha_fin}</span>
            </div>
            <div className="flex gap-3">
              <button className="btn-sm btn-edit" onClick={() => handleEdit(o)}>Editar</button>
              <button className="btn-sm btn-delete" onClick={() => handleDelete(o.id)}>Eliminar</button>
            </div>
          </div>
        ))}
        {ofertas.length === 0 && <div className="text-center py-12 text-muted">No has creado ofertas aun.</div>}
      </div>
    </div>
  )
}

