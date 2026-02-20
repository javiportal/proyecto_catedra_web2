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
      .eq('estado', 'aprobada')
      .lte('fecha_inicio', hoy)
      .gte('fecha_fin', hoy)

    if (!error) {
      setOfertas(data || [])
    }
    setLoading(false)
  }

  const ofertasFiltradas = rubroActivo === 'todos'
    ? ofertas
    : ofertas.filter(o => o.rubros?.id === rubroActivo)

  const calcularDescuento = (regular, oferta) => {
    return Math.round(((regular - oferta) / regular) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">
          🎟️ Las mejores ofertas están aquí
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Encuentra cupones de descuento en tus negocios favoritos.
        </p>
      </div>

      {/* Filtro por rubros */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setRubroActivo('todos')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            rubroActivo === 'todos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos
        </button>
        {rubros.map(rubro => (
          <button
            key={rubro.id}
            onClick={() => setRubroActivo(rubro.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              rubroActivo === rubro.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {rubro.nombre}
          </button>
        ))}
      </div>

      {/* Grid de ofertas */}
      {ofertasFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No hay ofertas disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ofertasFiltradas.map(oferta => (
            <Link
              to={`/oferta/${oferta.id}`}
              key={oferta.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <span className="absolute top-3 right-3 bg-white text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  -{calcularDescuento(oferta.precio_regular, oferta.precio_oferta)}%
                </span>
                <p className="text-sm opacity-80">{oferta.empresas?.nombre}</p>
                <h3 className="text-lg font-bold mt-1">{oferta.titulo}</h3>
              </div>

              <div className="p-5">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-2xl font-bold text-blue-700">
                    ${oferta.precio_oferta.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${oferta.precio_regular.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{oferta.descripcion}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>📅 Válido hasta {oferta.fecha_fin}</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {oferta.rubros?.nombre}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}