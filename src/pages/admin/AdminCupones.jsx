import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ESTADOS = ['disponible', 'canjeado', 'vencido']

function generateCode(size = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < size; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export default function AdminCupones() {
  const [cupones, setCupones] = useState([])
  const [clientes, setClientes] = useState([])
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [form, setForm] = useState({
    oferta_id: '',
    cliente_id: '',
    codigo: generateCode(),
    estado: 'disponible',
  })

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [cuponesRes, clientesRes, ofertasRes] = await Promise.all([
      supabase
        .from('cupones')
        .select('*, clientes(nombres, apellidos), ofertas(titulo, empresas(nombre))')
        .order('fecha_compra', { ascending: false }),
      supabase
        .from('clientes')
        .select('id, nombres, apellidos')
        .order('nombres'),
      supabase
        .from('ofertas')
        .select('id, titulo, estado, empresas(nombre)')
        .eq('estado', 'APROBADA')
        .order('titulo'),
    ])

    if (cuponesRes.error || clientesRes.error || ofertasRes.error) {
      toast.error(cuponesRes.error?.message || clientesRes.error?.message || ofertasRes.error?.message || 'Error cargando datos')
      setLoading(false)
      return
    }

    setCupones(cuponesRes.data || [])
    setClientes(clientesRes.data || [])
    setOfertas(ofertasRes.data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (filter === 'todos') return cupones
    return cupones.filter(c => c.estado === filter)
  }, [cupones, filter])

  const createCoupon = async () => {
    if (!form.oferta_id || !form.cliente_id) {
      toast.error('Selecciona una oferta y un cliente')
      return
    }

    setSaving(true)
    const payload = {
      oferta_id: form.oferta_id,
      cliente_id: form.cliente_id,
      codigo: form.codigo.trim().toUpperCase(),
      estado: form.estado,
      fecha_compra: new Date().toISOString(),
    }

    const { error } = await supabase.from('cupones').insert(payload)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Cupon creado')
    setForm({ oferta_id: '', cliente_id: '', codigo: generateCode(), estado: 'disponible' })
    loadAll()
  }

  const removeCoupon = async (id) => {
    if (!confirm('Eliminar este cupon?')) return
    const { error } = await supabase.from('cupones').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Cupon eliminado')
    loadAll()
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Gestion de Cupones</h1>
        <span className="admin-count">{cupones.length} cupones</span>
      </div>

      <div className="admin-form-card">
        <h2 className="admin-form-title">Nuevo cupon</h2>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Oferta aprobada</label>
            <select className="form-input" value={form.oferta_id} onChange={(e) => setForm({ ...form, oferta_id: e.target.value })}>
              <option value="">Seleccionar oferta...</option>
              {ofertas.map((o) => (
                <option key={o.id} value={o.id}>{o.titulo} - {o.empresas?.nombre || 'Sin empresa'}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-input" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Codigo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} maxLength={20} />
              <button className="btn-secondary" onClick={() => setForm({ ...form, codigo: generateCode() })}>Generar</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Estado inicial</label>
            <select className="form-input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn-primary" onClick={createCoupon} disabled={saving}>{saving ? 'Guardando...' : 'Crear cupon'}</button>
      </div>

      <div className="filters-wrap" style={{ justifyContent: 'flex-start', padding: '0 0 16px' }}>
        {['todos', ...ESTADOS].map((estado) => (
          <button key={estado} className={`filter-pill ${filter === estado ? 'active' : ''}`} onClick={() => setFilter(estado)}>
            {estado}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Estado</th>
              <th>Cliente</th>
              <th>Oferta</th>
              <th>Fecha compra</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><span className="badge-code">{c.codigo}</span></td>
                <td>{c.estado}</td>
                <td>{c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}` : 'N/A'}</td>
                <td>{c.ofertas?.titulo || 'N/A'}</td>
                <td>{c.fecha_compra ? new Date(c.fecha_compra).toLocaleString('es-SV') : 'N/A'}</td>
                <td>
                  <button className="btn-sm btn-delete" onClick={() => removeCoupon(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-muted">No hay cupones para este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

