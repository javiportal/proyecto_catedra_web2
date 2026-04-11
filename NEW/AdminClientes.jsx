import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchClientes() }, [])

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombres')
    setClientes(data || [])
    setLoading(false)
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
            <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>DUI</th><th>Dirección</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="font-semibold">{c.nombres} {c.apellidos}</td>
                <td>{c.correo}</td>
                <td>{c.telefono}</td>
                <td>{c.dui}</td>
                <td>{c.direccion}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-[var(--text-muted)]">No se encontraron clientes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
