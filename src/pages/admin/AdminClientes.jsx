import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [detalleExtra, setDetalleExtra] = useState({ cupones: 0, compras: 0 })

  useEffect(() => { fetchClientes() }, [])

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombres')
    setClientes(data || [])
    setLoading(false)
  }

  const verDetalle = async (cliente) => {
    setDetalle(cliente)
    const [cuponesRes, comprasRes] = await Promise.all([
      supabase.from('cupones').select('id', { count: 'exact', head: true }).eq('cliente_id', cliente.id),
      supabase.from('compras').select('id', { count: 'exact', head: true }).eq('cliente_id', cliente.id),
    ])
    setDetalleExtra({
      cupones: cuponesRes.count || 0,
      compras: comprasRes.count || 0,
    })
  }

  const filtered = clientes.filter(c =>
    `${c.nombres} ${c.apellidos} ${c.correo} ${c.dui}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Clientes Registrados</h1>
        <span className="admin-count">{clientes.length} clientes</span>
      </div>
      <input className="form-input mb-6" placeholder="Buscar por nombre, correo o DUI..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Telefono</th><th>DUI</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="font-semibold">{c.nombres} {c.apellidos}</td>
                <td>{c.correo}</td>
                <td>{c.telefono}</td>
                <td>{c.dui}</td>
                <td>
                  <button className="btn-sm btn-edit" onClick={() => verDetalle(c)}>Ver Detalle</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-muted">No se encontraron clientes.</td></tr>}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="detail-overlay" onClick={() => setDetalle(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setDetalle(null)}>&times;</button>
            <h2 className="detail-title">{detalle.nombres} {detalle.apellidos}</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-label">Correo</div>
                <div className="detail-value">{detalle.correo}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Telefono</div>
                <div className="detail-value">{detalle.telefono || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">DUI</div>
                <div className="detail-value">{detalle.dui || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Direccion</div>
                <div className="detail-value">{detalle.direccion || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Total Cupones</div>
                <div className="detail-value">{detalleExtra.cupones}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Total Compras</div>
                <div className="detail-value">{detalleExtra.compras}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Registrado</div>
                <div className="detail-value">{detalle.created_at ? new Date(detalle.created_at).toLocaleDateString('es-SV') : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
