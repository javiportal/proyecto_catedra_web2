import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function CanjearCupon() {
  const { empresaId } = useAuth()
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [canjeando, setCanjeando] = useState(false)
  const [error, setError] = useState('')

  const buscarCupon = async () => {
    if (!codigo.trim()) { setError('Ingresa un código de cupón'); return }
    setError(''); setLoading(true); setCupon(null)

    const { data, error: e } = await supabase
      .from('cupones')
      .select('*, ofertas(*, empresas(id, nombre, codigo), rubros(nombre)), clientes(nombres, apellidos, dui)')
      .eq('codigo', codigo.trim())
      .maybeSingle()

    setLoading(false)

    if (e) { setError('Error al buscar: ' + e.message); return }
    if (!data) { setError('Cupón no encontrado'); return }

    // Validate the coupon belongs to this employee's empresa
    if (empresaId && data.ofertas?.empresas?.id !== empresaId) {
      setError('Este cupón no pertenece a tu empresa')
      return
    }

    setCupon(data)
  }

  const canjear = async () => {
    if (!cupon) return
    setCanjeando(true)

    const hoy = new Date().toISOString().split('T')[0]

    if (cupon.estado !== 'disponible') {
      toast.error('Este cupón ya fue canjeado o no está disponible')
      setCanjeando(false)
      return
    }

    if (cupon.ofertas?.fecha_limite_cupon && cupon.ofertas.fecha_limite_cupon < hoy) {
      toast.error('Este cupón ya venció')
      setCanjeando(false)
      return
    }

    const { error } = await supabase
      .from('cupones')
      .update({ estado: 'canjeado', fecha_canje: new Date().toISOString() })
      .eq('id', cupon.id)

    setCanjeando(false)

    if (error) { toast.error('Error al canjear: ' + error.message); return }

    toast.success('¡Cupón canjeado exitosamente!')
    setCupon({ ...cupon, estado: 'canjeado' })
    setCodigo('')
  }

  const hoy = new Date().toISOString().split('T')[0]
  const vencido = cupon?.ofertas?.fecha_limite_cupon && cupon.ofertas.fecha_limite_cupon < hoy
  const canCanjear = cupon && cupon.estado === 'disponible' && !vencido

  return (
    <div className="admin-page" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 className="admin-title">Canjear Cupón</h1>

      <div className="admin-form-card">
        <div className="form-group">
          <label className="form-label">Código del Cupón</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: ABC1234567"
              onKeyDown={e => e.key === 'Enter' && buscarCupon()}
            />
            <button className="btn-primary" onClick={buscarCupon} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {error && <span className="form-error-text">{error}</span>}
        </div>
      </div>

      {cupon && (
        <div className="admin-offer-card" style={{ marginTop: 24 }}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-[var(--text)]">{cupon.ofertas?.titulo}</h3>
              <p className="text-sm text-[var(--gold)]">{cupon.ofertas?.empresas?.nombre}</p>
            </div>
            <span className={`admin-status-badge ${cupon.estado === 'disponible' && !vencido ? 'aprobada' : cupon.estado === 'canjeado' ? 'pendiente' : 'rechazada'}`}>
              {vencido ? 'Vencido' : cupon.estado === 'canjeado' ? 'Ya Canjeado' : 'Disponible'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-[var(--text-muted)]">Cliente:</span> <span className="text-[var(--text)]">{cupon.clientes?.nombres} {cupon.clientes?.apellidos}</span></div>
            <div><span className="text-[var(--text-muted)]">DUI:</span> <span className="text-[var(--text)]">{cupon.clientes?.dui}</span></div>
            <div><span className="text-[var(--text-muted)]">Código:</span> <span className="text-[var(--gold)] font-mono font-bold">{cupon.codigo}</span></div>
            <div><span className="text-[var(--text-muted)]">Precio:</span> <span className="text-[var(--gold)]">${cupon.ofertas?.precio_oferta}</span></div>
            <div><span className="text-[var(--text-muted)]">Válido hasta:</span> <span className="text-[var(--text)]">{cupon.ofertas?.fecha_limite_cupon}</span></div>
            <div><span className="text-[var(--text-muted)]">Comprado:</span> <span className="text-[var(--text)]">{new Date(cupon.fecha_compra).toLocaleDateString('es-SV')}</span></div>
          </div>

          {canCanjear && (
            <button className="btn-primary w-full" onClick={canjear} disabled={canjeando} style={{ padding: '14px 24px', fontSize: '1rem' }}>
              {canjeando ? 'Canjeando...' : 'Confirmar Canje'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
