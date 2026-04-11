import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminOfertas() {
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('PENDIENTE')

  useEffect(() => { fetchOfertas() }, [])

  const fetchOfertas = async () => {
    const { data } = await supabase
      .from('ofertas')
      .select('*, empresas(nombre, codigo), rubros(nombre)')
      .order('created_at', { ascending: false })
    setOfertas(data || [])
    setLoading(false)
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    const label = nuevoEstado === 'APROBADA' ? 'aprobar' : 'rechazar'
    if (!confirm(`¿Deseas ${label} esta oferta?`)) return
    const { error } = await supabase.from('ofertas').update({ estado: nuevoEstado }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success(`Oferta ${nuevoEstado.toLowerCase()}`); fetchOfertas() }
  }

  const filtradas = ofertas.filter(o => {
    if (filtro === 'TODAS') return true
    return (o.estado || '').toUpperCase() === filtro
  })

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Aprobación de Ofertas</h1>
        <span className="admin-count">{ofertas.filter(o => (o.estado || '').toUpperCase() === 'PENDIENTE').length} pendientes</span>
      </div>

      <div className="filters-wrap" style={{ justifyContent: 'flex-start', padding: '0 0 24px' }}>
        {['PENDIENTE', 'APROBADA', 'RECHAZADA', 'TODAS'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`filter-pill ${filtro === f ? 'active' : ''}`}>
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtradas.map(oferta => (
          <div key={oferta.id} className="admin-offer-card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">{oferta.titulo}</h3>
                <p className="text-sm text-[var(--gold)]">{oferta.empresas?.nombre} ({oferta.empresas?.codigo})</p>
              </div>
              <span className={`admin-status-badge ${(oferta.estado || '').toLowerCase()}`}>
                {oferta.estado}
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">{oferta.descripcion}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              <div><span className="text-[var(--text-muted)]">Rubro:</span> <span className="text-[var(--text)]">{oferta.rubros?.nombre}</span></div>
              <div><span className="text-[var(--text-muted)]">Regular:</span> <span className="text-[var(--text)]">${oferta.precio_regular}</span></div>
              <div><span className="text-[var(--text-muted)]">Oferta:</span> <span className="text-[var(--gold)]">${oferta.precio_oferta}</span></div>
              <div><span className="text-[var(--text-muted)]">Vigencia:</span> <span className="text-[var(--text)]">{oferta.fecha_inicio} — {oferta.fecha_fin}</span></div>
            </div>
            {(oferta.estado || '').toUpperCase() === 'PENDIENTE' && (
              <div className="flex gap-3">
                <button className="btn-primary" onClick={() => cambiarEstado(oferta.id, 'APROBADA')}>Aprobar</button>
                <button className="btn-danger" onClick={() => cambiarEstado(oferta.id, 'RECHAZADA')}>Rechazar</button>
              </div>
            )}
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">No hay ofertas con este filtro.</div>
        )}
      </div>
    </div>
  )
}
