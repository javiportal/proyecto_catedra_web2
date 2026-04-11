import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ESTADOS = ['disponible', 'canjeado', 'vencido']

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function isApprovedStatus(status) {
  return normalizeText(status) === 'aprobada'
}

function generateCode(size = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < size; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export default function AdminCupones() {
  const location = useLocation()
  const [cupones, setCupones] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [rubros, setRubros] = useState([])
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [form, setForm] = useState({
    empresa_id: '',
    rubro_id: '',
    codigo: generateCode(),
    nombre_oferta: '',
    descripcion: '',
    fecha_expiracion: '',
    auto_aprobar_oferta: true,
  })

  const newMode = useMemo(() => new URLSearchParams(location.search).get('nuevo') === '1', [location.search])

  const empresaNombreSeleccionada = useMemo(
    () => empresas.find((e) => e.id === form.empresa_id)?.nombre || '',
    [empresas, form.empresa_id]
  )

  const ofertasAprobadasEmpresa = useMemo(
    () => ofertas.filter((o) => {
      const sameCompany = o.empresa_id === form.empresa_id
      const approved = isApprovedStatus(o.estado)
      const sameRubro = !form.rubro_id || o.rubro_id === form.rubro_id
      return sameCompany && approved && sameRubro
    }),
    [ofertas, form.empresa_id, form.rubro_id]
  )

  async function loadAll() {
    setLoading(true)
    const [cuponesRes, ofertasRes, empresasRes, rubrosRes] = await Promise.all([
      supabase
        .from('cupones')
        .select('id, codigo, estado, fecha_compra, fecha_expiracion, ofertas(titulo, descripcion, empresas(nombre))')
        .order('fecha_compra', { ascending: false }),
      supabase
        .from('ofertas')
        .select('id, empresa_id, rubro_id, titulo, descripcion, estado, empresas(id, nombre), rubros(id, nombre)')
        .order('titulo'),
      supabase
        .from('empresas')
        .select('id, nombre')
        .order('nombre'),
      supabase
        .from('rubros')
        .select('id, nombre')
        .order('nombre'),
    ])

    if (cuponesRes.error || ofertasRes.error || empresasRes.error || rubrosRes.error) {
      toast.error(cuponesRes.error?.message || ofertasRes.error?.message || empresasRes.error?.message || rubrosRes.error?.message || 'Error cargando datos')
      setLoading(false)
      return
    }

    setCupones(cuponesRes.data || [])
    setOfertas(ofertasRes.data || [])
    setEmpresas(empresasRes.data || [])
    setRubros(rubrosRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'todos') return cupones
    return cupones.filter(c => c.estado === filter)
  }, [cupones, filter])

  const createCoupon = async () => {
    if (!form.empresa_id || !form.rubro_id || !form.nombre_oferta.trim()) {
      toast.error('Selecciona empresa, rubro e ingresa el nombre de la oferta')
      return
    }

    const desired = normalizeText(form.nombre_oferta)

    let ofertaEncontrada = ofertasAprobadasEmpresa.find((o) => normalizeText(o.titulo) === desired)

    if (!ofertaEncontrada && desired) {
      const fuzzy = ofertasAprobadasEmpresa.filter((o) => {
        const title = normalizeText(o.titulo)
        return title.includes(desired) || desired.includes(title)
      })

      if (fuzzy.length === 1) {
        ofertaEncontrada = fuzzy[0]
      } else if (fuzzy.length > 1) {
        toast.error('Hay varias ofertas parecidas. Escribe el nombre mas exacto o elige una sugerencia.')
        return
      }
    }

    if (!ofertaEncontrada) {
      const ofertasEmpresa = ofertas.filter((o) => {
        const sameCompany = o.empresa_id === form.empresa_id
        const sameRubro = o.rubro_id === form.rubro_id
        return sameCompany && sameRubro
      })

      let ofertaNoAprobada = ofertasEmpresa.find((o) => normalizeText(o.titulo) === desired)

      if (!ofertaNoAprobada && desired) {
        const fuzzyEmpresa = ofertasEmpresa.filter((o) => {
          const title = normalizeText(o.titulo)
          return title.includes(desired) || desired.includes(title)
        })

        if (fuzzyEmpresa.length === 1) {
          ofertaNoAprobada = fuzzyEmpresa[0]
        } else if (fuzzyEmpresa.length > 1) {
          toast.error('Hay varias ofertas parecidas. Escribe el nombre mas exacto o elige una sugerencia.')
          return
        }
      }

      if (!ofertaNoAprobada) {
        // If the offer does not exist yet, create it on the fly so "Nuevo Cupon"
        // can work as a full create flow from this screen.
        const today = new Date().toISOString().slice(0, 10)
        const future = new Date()
        future.setDate(future.getDate() + 30)
        const futureDate = future.toISOString().slice(0, 10)

        const { data: nuevaOferta, error: createOfferError } = await supabase
          .from('ofertas')
          .insert({
            empresa_id: form.empresa_id,
            rubro_id: form.rubro_id,
            titulo: form.nombre_oferta.trim(),
            descripcion: form.descripcion?.trim() || `Oferta creada desde Nuevo Cupon: ${form.nombre_oferta.trim()}`,
            precio_regular: 2,
            precio_oferta: 1,
            fecha_inicio: today,
            fecha_fin: futureDate,
            fecha_limite_cupon: form.fecha_expiracion || futureDate,
            cantidad_limite: null,
            estado: 'APROBADA',
          })
          .select('id, empresa_id, rubro_id, titulo, descripcion, estado')
          .single()

        if (createOfferError) {
          toast.error('No se pudo crear la oferta nueva: ' + createOfferError.message)
          return
        }

        ofertaEncontrada = nuevaOferta
        toast.success('Oferta nueva creada y aprobada automaticamente')
      }

      if (!ofertaEncontrada && ofertaNoAprobada) {
        if (!form.auto_aprobar_oferta) {
          toast.error('La oferta encontrada no esta APROBADA. Activa "Aprobar oferta al crear" para continuar.')
          return
        }

        const { error: approveError } = await supabase
          .from('ofertas')
          .update({ estado: 'APROBADA' })
          .eq('id', ofertaNoAprobada.id)

        if (approveError) {
          toast.error('No se pudo aprobar la oferta: ' + approveError.message)
          return
        }

        ofertaEncontrada = { ...ofertaNoAprobada, estado: 'APROBADA' }
        toast.success('Oferta aprobada automaticamente')
      }
    }

    setSaving(true)
    const payload = {
      oferta_id: ofertaEncontrada.id,
      codigo: form.codigo.trim().toUpperCase(),
      estado: 'disponible',
      fecha_compra: new Date().toISOString(),
      fecha_expiracion: form.fecha_expiracion ? new Date(`${form.fecha_expiracion}T23:59:59`).toISOString() : null,
    }

    const { error } = await supabase.from('cupones').insert(payload)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Cupon creado')
    setForm({ empresa_id: '', rubro_id: '', codigo: generateCode(), nombre_oferta: '', descripcion: '', fecha_expiracion: '', auto_aprobar_oferta: true })
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
        <h2 className="admin-form-title">{newMode ? 'Nuevo Cupon' : 'Crear Cupon'}</h2>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Empresa disponible</label>
            <select
              className="form-input"
              value={form.empresa_id}
              onChange={(e) => {
                setForm({ ...form, empresa_id: e.target.value, rubro_id: '', nombre_oferta: '', descripcion: '', fecha_expiracion: form.fecha_expiracion })
              }}
            >
              <option value="">Seleccionar empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rubro</label>
            <select
              className="form-input"
              value={form.rubro_id}
              onChange={(e) => setForm({ ...form, rubro_id: e.target.value, nombre_oferta: '' })}
              disabled={!form.empresa_id}
            >
              <option value="">Seleccionar rubro...</option>
              {rubros.map((rubro) => (
                <option key={rubro.id} value={rubro.id}>{rubro.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Nombre de la oferta</label>
            <input
              className="form-input"
              value={form.nombre_oferta}
              onChange={(e) => setForm({ ...form, nombre_oferta: e.target.value })}
              placeholder="Escribe oferta existente o una nueva (se crea automaticamente)"
              list="ofertas-aprobadas-list"
              disabled={!form.empresa_id || !form.rubro_id}
            />
            <datalist id="ofertas-aprobadas-list">
              {ofertasAprobadasEmpresa.map((o) => (
                <option key={o.id} value={o.titulo} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: -4 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>Aprobacion</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={form.auto_aprobar_oferta}
              onChange={(e) => setForm({ ...form, auto_aprobar_oferta: e.target.checked })}
            />
            Aprobar oferta al crear cupon (si aun no esta aprobada)
          </label>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Descripcion del cupon</label>
            <input
              className="form-input"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Texto de apoyo para identificar el cupon"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de expiracion del cupon</label>
            <input
              type="date"
              className="form-input"
              value={form.fecha_expiracion}
              onChange={(e) => setForm({ ...form, fecha_expiracion: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Empresa asociada</label>
            <input
              className="form-input"
              value={empresaNombreSeleccionada}
              readOnly
              placeholder="Se completa al seleccionar empresa"
            />
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
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Expira</th>
              <th>Fecha compra</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><span className="badge-code">{c.codigo}</span></td>
                <td>{c.ofertas?.titulo || 'N/A'}</td>
                <td>{c.ofertas?.descripcion || 'N/A'}</td>
                <td>{c.ofertas?.empresas?.nombre || 'N/A'}</td>
                <td>{c.estado}</td>
                <td>{c.fecha_expiracion ? new Date(c.fecha_expiracion).toLocaleDateString('es-SV') : 'Sin fecha'}</td>
                <td>{c.fecha_compra ? new Date(c.fecha_compra).toLocaleString('es-SV') : 'N/A'}</td>
                <td>
                  <button className="btn-sm btn-delete" onClick={() => removeCoupon(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-muted">No hay cupones para este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

