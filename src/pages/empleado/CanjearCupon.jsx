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
    if (!codigo.trim()) {
      setError('Ingresa un codigo de cupon')
      return
    }
    setError('')
    setLoading(true)
    setCupon(null)

    const { data, error: e } = await supabase
      .from('cupones')
      .select('*, ofertas(*, empresas(id, nombre, codigo), rubros(nombre)), clientes(nombres, apellidos, dui)')
      .eq('codigo', codigo.trim())
      .maybeSingle()

    setLoading(false)

    if (e) {
      setError('Error al buscar: ' + e.message)
      return
    }
    if (!data) {
      setError('Cupon no encontrado')
      return
    }

    if (empresaId && data.ofertas?.empresas?.id !== empresaId) {
      setError('Este cupon no pertenece a tu empresa')
      return
    }

    setCupon(data)
  }

  const canjear = async () => {
    if (!cupon) return
    setCanjeando(true)

    const hoy = new Date().toISOString().split('T')[0]

    if (cupon.estado !== 'disponible') {
      toast.error('Este cupon ya fue canjeado o no esta disponible')
      setCanjeando(false)
      return
    }

    if (cupon.ofertas?.fecha_limite_cupon && cupon.ofertas.fecha_limite_cupon < hoy) {
      toast.error('Este cupon ya vencio')
      setCanjeando(false)
      return
    }

    const { error } = await supabase
      .from('cupones')
      .update({ estado: 'canjeado', fecha_canje: new Date().toISOString() })
      .eq('id', cupon.id)

    setCanjeando(false)

    if (error) {
      toast.error('Error al canjear: ' + error.message)
      return
    }

    toast.success('Cupon canjeado exitosamente')
    setCupon({ ...cupon, estado: 'canjeado' })
    setCodigo('')
  }

  const hoy = new Date().toISOString().split('T')[0]
  const vencido = cupon?.ofertas?.fecha_limite_cupon && cupon.ofertas.fecha_limite_cupon < hoy
  const canCanjear = cupon && cupon.estado === 'disponible' && !vencido

  return (
    <div className="admin-page" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 className="admin-title">Canjear Cupon</h1>

      <div className="admin-form-card">
        <div className="form-group">
          <label className="form-label">Codigo del Cupon</label>
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
              <h3 className="text-xl font-bold text-main">{cupon.ofertas?.titulo}</h3>
              <p className="text-sm text-gold">{cupon.ofertas?.empresas?.nombre}</p>
            </div>
            <span className={`admin-status-badge ${cupon.estado === 'disponible' && !vencido ? 'aprobada' : cupon.estado === 'canjeado' ? 'pendiente' : 'rechazada'}`}>
              {vencido ? 'Vencido' : cupon.estado === 'canjeado' ? 'Ya Canjeado' : 'Disponible'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-muted">Cliente:</span> <span className="text-main">{cupon.clientes?.nombres} {cupon.clientes?.apellidos}</span></div>
            <div><span className="text-muted">DUI:</span> <span className="text-main">{cupon.clientes?.dui}</span></div>
            <div><span className="text-muted">Codigo:</span> <span className="text-gold font-mono font-bold">{cupon.codigo}</span></div>
            <div><span className="text-muted">Precio:</span> <span className="text-gold">${cupon.ofertas?.precio_oferta}</span></div>
            <div><span className="text-muted">Valido hasta:</span> <span className="text-main">{cupon.ofertas?.fecha_limite_cupon}</span></div>
            <div><span className="text-muted">Comprado:</span> <span className="text-main">{new Date(cupon.fecha_compra).toLocaleDateString('es-SV')}</span></div>
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

