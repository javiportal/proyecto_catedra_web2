import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const [ofertas, setOfertas] = useState([])
  const [rubros, setRubros] = useState([])
  const [rubroActivo, setRubroActivo] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRubros()
    fetchOfertas()
  }, [])

  const fetchRubros = async () => {
    const { data } = await supabase.from('rubros').select('*').order('nombre')
    setRubros(data || [])
  }

  const fetchOfertas = async () => {
    const hoy = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('ofertas')
      .select(`
        *,
        empresas (nombre, codigo),
        rubros (id, nombre)
      `)
      .ilike('estado', 'aprobada')

    if (error) {
      console.error('Error fetching ofertas:', error)
      setOfertas([])
      setLoading(false)
      return
    }

    const ofertasVigentes = (data || []).filter((oferta) => {
      const inicioOk = !oferta.fecha_inicio || oferta.fecha_inicio <= hoy
      const finOk = !oferta.fecha_fin || oferta.fecha_fin >= hoy
      return inicioOk && finOk
    })

    setOfertas(ofertasVigentes)
    setLoading(false)
  }

  const ofertasFiltradas = rubroActivo === 'todos'
    ? ofertas
    : ofertas.filter(o => o.rubros?.id === rubroActivo)

  const calcularDescuento = (regular, oferta) =>
    Math.round(((regular - oferta) / regular) * 100)

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-watermark">%</div>

        <div className="hero-eyebrow">
          <span>✦</span> Cupones activos hoy
        </div>

        <h1 className="hero-title">
          Las mejores ofertas<br />
          están <em>aquí</em>
        </h1>

        <p className="hero-sub">
          Encuentra cupones de descuento en tus negocios favoritos de El Salvador. Ahorra en cada compra.
        </p>
      </section>

      {/* Filtros */}
      <div className="filters-wrap">
        <button
          onClick={() => setRubroActivo('todos')}
          className={`filter-pill ${rubroActivo === 'todos' ? 'active' : ''}`}
        >
          Todos
        </button>
        {rubros.map(rubro => (
          <button
            key={rubro.id}
            onClick={() => setRubroActivo(rubro.id)}
            className={`filter-pill ${rubroActivo === rubro.id ? 'active' : ''}`}
          >
            {rubro.nombre}
          </button>
        ))}
      </div>

      {/* Grid de cupones */}
      {ofertasFiltradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎟️</div>
          <p className="empty-text">No hay ofertas disponibles en este momento.</p>
        </div>
      ) : (
        <div className="offers-grid">
          {ofertasFiltradas.map((oferta, i) => (
            <Link
              to={`/oferta/${oferta.id}`}
              key={oferta.id}
              className="coupon-card"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="coupon-header">
                <p className="coupon-company">{oferta.empresas?.nombre}</p>
                <h3 className="coupon-title">{oferta.titulo}</h3>
                <span className="coupon-badge">
                  -{calcularDescuento(oferta.precio_regular, oferta.precio_oferta)}%
                </span>
              </div>

              <div className="coupon-body">
                <div className="coupon-prices">
                  <span className="coupon-price-main">
                    ${oferta.precio_oferta.toFixed(2)}
                  </span>
                  <span className="coupon-price-was">
                    ${oferta.precio_regular.toFixed(2)}
                  </span>
                </div>

                <p className="coupon-desc">{oferta.descripcion}</p>

                <div className="coupon-meta">
                  <span className="coupon-validity">
                    Hasta {oferta.fecha_fin}
                  </span>
                  <span className="coupon-tag">{oferta.rubros?.nombre}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
