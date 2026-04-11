import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import './AdminCupones.css'
import {
  fetchAdminCuponesData,
  insertCupon,
  removeCupon,
  insertOfertaAprobada,
  aprobarOferta,
} from '../../services/cuponesService'

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

// ─── client-side validation (mirrors DB constraints) ─────────
function validateCouponForm(form) {
  const errors = {}
  const today = new Date().toISOString().slice(0, 10)

  if (!form.empresa_id) errors.empresa_id = 'Selecciona una empresa'
  if (!form.rubro_id) errors.rubro_id = 'Selecciona un rubro'
  if (!form.nombre_oferta.trim()) errors.nombre_oferta = 'Ingresa el nombre de la oferta'

  if (!form.codigo.trim()) {
    errors.codigo = 'El codigo es requerido'
  } else if (form.codigo.trim().length < 4) {
    errors.codigo = 'Minimo 4 caracteres'
  } else if (!/^[A-Z0-9]+$/.test(form.codigo.trim())) {
    errors.codigo = 'Solo letras mayusculas y numeros'
  }

  if (form.fecha_expiracion && form.fecha_expiracion < today) {
    errors.fecha_expiracion = 'La fecha de expiracion debe ser hoy o futura'
  }

  return errors
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
  const [formErrors, setFormErrors] = useState({})

  const [form, setForm] = useState({
    empresa_id: '',
    rubro_id: '',
    codigo: generateCode(),
    nombre_oferta: '',
    descripcion: '',
    fecha_expiracion: '',
    auto_aprobar_oferta: true,
  })

  const newMode = useMemo(
    () => new URLSearchParams(location.search).get('nuevo') === '1',
    [location.search],
  )

  const empresaNombreSeleccionada = useMemo(
    () => empresas.find((e) => e.id === form.empresa_id)?.nombre || '',
    [empresas, form.empresa_id],
  )

  const ofertasAprobadasEmpresa = useMemo(
    () =>
      ofertas.filter((o) => {
        const sameCompany = o.empresa_id === form.empresa_id
        const approved = isApprovedStatus(o.estado)
        const sameRubro = !form.rubro_id || o.rubro_id === form.rubro_id
        return sameCompany && approved && sameRubro
      }),
    [ofertas, form.empresa_id, form.rubro_id],
  )

  async function loadAll() {
    setLoading(true)
    try {
      const data = await fetchAdminCuponesData()
      setCupones(data.cupones)
      setOfertas(data.ofertas)
      setEmpresas(data.empresas)
      setRubros(data.rubros)
    } catch (e) {
      toast.error(e.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const filtered = useMemo(() => {
    if (filter === 'todos') return cupones
    return cupones.filter(c => c.estado === filter)
  }, [cupones, filter])

  // ── form field helper ────────────────────────────────────────
  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    // Clear the error for this field as the user types.
    if (formErrors[key]) {
      setFormErrors(prev => { const next = { ...prev }; delete next[key]; return next })
    }
  }

  // ── create coupon ────────────────────────────────────────────
  const createCoupon = async () => {
    const errors = validateCouponForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Corrige los errores en el formulario')
      return
    }
    setFormErrors({})

    const desired = normalizeText(form.nombre_oferta)

    let ofertaEncontrada = ofertasAprobadasEmpresa.find(
      (o) => normalizeText(o.titulo) === desired,
    )

    if (!ofertaEncontrada && desired) {
      const fuzzy = ofertasAprobadasEmpresa.filter((o) => {
        const title = normalizeText(o.titulo)
        return title.includes(desired) || desired.includes(title)
      })
      if (fuzzy.length === 1) {
        ofertaEncontrada = fuzzy[0]
      } else if (fuzzy.length > 1) {
        toast.error('Hay varias ofertas parecidas. Escribe el nombre mas exacto.')
        return
      }
    }

    if (!ofertaEncontrada) {
      const ofertasEmpresa = ofertas.filter(
        (o) => o.empresa_id === form.empresa_id && o.rubro_id === form.rubro_id,
      )
      let ofertaNoAprobada = ofertasEmpresa.find(
        (o) => normalizeText(o.titulo) === desired,
      )

      if (!ofertaNoAprobada && desired) {
        const fuzzyEmpresa = ofertasEmpresa.filter((o) => {
          const title = normalizeText(o.titulo)
          return title.includes(desired) || desired.includes(title)
        })
        if (fuzzyEmpresa.length === 1) ofertaNoAprobada = fuzzyEmpresa[0]
        else if (fuzzyEmpresa.length > 1) {
          toast.error('Hay varias ofertas parecidas. Escribe el nombre mas exacto.')
          return
        }
      }

      if (!ofertaNoAprobada) {
        // Offer doesn't exist — create it on the fly.
        const today = new Date().toISOString().slice(0, 10)
        const future = new Date()
        future.setDate(future.getDate() + 30)
        const futureDate = future.toISOString().slice(0, 10)

        try {
          ofertaEncontrada = await insertOfertaAprobada({
            empresa_id: form.empresa_id,
            rubro_id: form.rubro_id,
            titulo: form.nombre_oferta.trim(),
            descripcion:
              form.descripcion?.trim() ||
              `Oferta creada desde Nuevo Cupon: ${form.nombre_oferta.trim()}`,
            precio_regular: 2,
            precio_oferta: 1,
            fecha_inicio: today,
            fecha_fin: futureDate,
            fecha_limite_cupon: form.fecha_expiracion || futureDate,
            cantidad_limite: null,
          })
          toast.success('Oferta nueva creada y aprobada automaticamente')
        } catch (e) {
          toast.error('No se pudo crear la oferta: ' + e.message)
          return
        }
      } else if (!ofertaEncontrada && ofertaNoAprobada) {
        if (!form.auto_aprobar_oferta) {
          toast.error(
            'La oferta encontrada no esta APROBADA. Activa "Aprobar oferta al crear" para continuar.',
          )
          return
        }
        try {
          await aprobarOferta(ofertaNoAprobada.id)
          ofertaEncontrada = { ...ofertaNoAprobada, estado: 'APROBADA' }
          toast.success('Oferta aprobada automaticamente')
        } catch (e) {
          toast.error('No se pudo aprobar la oferta: ' + e.message)
          return
        }
      }
    }

    setSaving(true)
    const payload = {
      oferta_id: ofertaEncontrada.id,
      codigo: form.codigo.trim().toUpperCase(),
      estado: 'disponible',
      fecha_compra: new Date().toISOString(),
      fecha_expiracion: form.fecha_expiracion
        ? new Date(`${form.fecha_expiracion}T23:59:59`).toISOString()
        : null,
    }

    try {
      await insertCupon(payload)
      toast.success('Cupon creado')
      setForm({
        empresa_id: '',
        rubro_id: '',
        codigo: generateCode(),
        nombre_oferta: '',
        descripcion: '',
        fecha_expiracion: '',
        auto_aprobar_oferta: true,
      })
      setFormErrors({})
      loadAll()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveCoupon = async (id) => {
    if (!confirm('Eliminar este cupon?')) return
    try {
      await removeCupon(id)
      toast.success('Cupon eliminado')
      loadAll()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Gestion de Cupones</h1>
        <span className="admin-count">{cupones.length} cupones</span>
      </div>

      {/* ── create-coupon form ── */}
      <div className="admin-form-card">
        <h2 className="admin-form-title">{newMode ? 'Nuevo Cupon' : 'Crear Cupon'}</h2>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Empresa</label>
            <select
              className={`form-input ${formErrors.empresa_id ? 'form-input-error' : ''}`}
              value={form.empresa_id}
              onChange={(e) =>
                setField('empresa_id', e.target.value) ||
                setForm(prev => ({
                  ...prev,
                  empresa_id: e.target.value,
                  rubro_id: '',
                  nombre_oferta: '',
                  descripcion: '',
                }))
              }
            >
              <option value="">Seleccionar empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
              ))}
            </select>
            {formErrors.empresa_id && (
              <span className="form-error-text">{formErrors.empresa_id}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Rubro</label>
            <select
              className={`form-input ${formErrors.rubro_id ? 'form-input-error' : ''}`}
              value={form.rubro_id}
              onChange={(e) => {
                setForm(prev => ({ ...prev, rubro_id: e.target.value, nombre_oferta: '' }))
                if (formErrors.rubro_id) setFormErrors(prev => { const n = { ...prev }; delete n.rubro_id; return n })
              }}
              disabled={!form.empresa_id}
            >
              <option value="">Seleccionar rubro...</option>
              {rubros.map((rubro) => (
                <option key={rubro.id} value={rubro.id}>{rubro.nombre}</option>
              ))}
            </select>
            {formErrors.rubro_id && (
              <span className="form-error-text">{formErrors.rubro_id}</span>
            )}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Nombre de la oferta</label>
            <input
              className={`form-input ${formErrors.nombre_oferta ? 'form-input-error' : ''}`}
              value={form.nombre_oferta}
              onChange={(e) => setField('nombre_oferta', e.target.value)}
              placeholder="Oferta existente o nueva (se crea automaticamente)"
              list="ofertas-aprobadas-list"
              disabled={!form.empresa_id || !form.rubro_id}
            />
            <datalist id="ofertas-aprobadas-list">
              {ofertasAprobadasEmpresa.map((o) => (
                <option key={o.id} value={o.titulo} />
              ))}
            </datalist>
            {formErrors.nombre_oferta && (
              <span className="form-error-text">{formErrors.nombre_oferta}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Descripcion del cupon</label>
            <input
              className="form-input"
              value={form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              placeholder="Texto de apoyo para identificar el cupon"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label admin-cupones-approval-label">Aprobacion</label>
          <label className="admin-cupones-approval-toggle">
            <input
              type="checkbox"
              checked={form.auto_aprobar_oferta}
              onChange={(e) => setField('auto_aprobar_oferta', e.target.checked)}
            />
            Aprobar oferta al crear cupon (si aun no esta aprobada)
          </label>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Fecha de expiracion del cupon</label>
            <input
              type="date"
              className={`form-input ${formErrors.fecha_expiracion ? 'form-input-error' : ''}`}
              value={form.fecha_expiracion}
              onChange={(e) => setField('fecha_expiracion', e.target.value)}
            />
            {formErrors.fecha_expiracion && (
              <span className="form-error-text">{formErrors.fecha_expiracion}</span>
            )}
          </div>
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
            <label className="form-label">Codigo del cupon</label>
            <div className="admin-cupones-code-row">
              <input
                className={`form-input ${formErrors.codigo ? 'form-input-error' : ''}`}
                value={form.codigo}
                onChange={(e) => setField('codigo', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
              />
              <button
                className="btn-secondary"
                onClick={() => setField('codigo', generateCode())}
              >
                Generar
              </button>
            </div>
            {formErrors.codigo && (
              <span className="form-error-text">{formErrors.codigo}</span>
            )}
          </div>
        </div>

        <button className="btn-primary" onClick={createCoupon} disabled={saving}>
          {saving ? 'Guardando...' : 'Crear cupon'}
        </button>
      </div>

      {/* ── filter tabs ── */}
      <div className="filters-wrap admin-cupones-filter-row">
        {['todos', ...ESTADOS].map((estado) => (
          <button
            key={estado}
            className={`filter-pill ${filter === estado ? 'active' : ''}`}
            onClick={() => setFilter(estado)}
          >
            {estado}
          </button>
        ))}
      </div>

      {/* ── table ── */}
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
                <td>
                  {c.fecha_expiracion
                    ? new Date(c.fecha_expiracion).toLocaleDateString('es-SV')
                    : 'Sin fecha'}
                </td>
                <td>
                  {c.fecha_compra
                    ? new Date(c.fecha_compra).toLocaleString('es-SV')
                    : 'N/A'}
                </td>
                <td>
                  <button className="btn-sm btn-delete" onClick={() => handleRemoveCoupon(c.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-muted">
                  No hay cupones para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
