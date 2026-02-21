import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function OfferDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [oferta, setOferta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cantidad, setCantidad] = useState(1)
  const [cuponesVendidos, setCuponesVendidos] = useState(0)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchOferta()
  }, [id])

  const fetchOferta = async () => {
    const { data, error } = await supabase
      .from('ofertas')
      .select(`
        *,
        empresas (nombre, codigo, porcentaje_comision),
        rubros (nombre)
      `)
      .eq('id', id)
      .single()

    if (!error) {
      setOferta(data)
      const { count } = await supabase
        .from('cupones')
        .select('*', { count: 'exact', head: true })
        .eq('oferta_id', id)
      setCuponesVendidos(count || 0)
    }
    setLoading(false)
  }

  const cuponesDisponibles = oferta?.cantidad_limite
    ? oferta.cantidad_limite - cuponesVendidos
    : null

  const generarCodigoCupon = (codigoEmpresa) => {
    const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
    return `${codigoEmpresa}${random}`
  }

  const handleComprar = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para comprar cupones')
      navigate('/login')
      return
    }

    setProcessing(true)

    try {
      const cupones = []

      for (let i = 0; i < cantidad; i++) {
        cupones.push({
          oferta_id: oferta.id,
          cliente_id: profile.id,
          codigo: generarCodigoCupon(oferta.empresas.codigo),
          estado: 'disponible',
          fecha_compra: new Date().toISOString(),
        })
      }

      const { error } = await supabase.from('cupones').insert(cupones)

      if (error) throw error

      toast.success(`¡Compra exitosa! ${cantidad} cupón(es) generado(s).`)
      navigate('/mis-cupones')
    } catch (error) {
      toast.error('Error al procesar la compra: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!oferta) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Oferta no encontrada.</p>
      </div>
    )
  }

  const descuento = Math.round(((oferta.precio_regular - oferta.precio_oferta) / oferta.precio_regular) * 100)
  const agotado = cuponesDisponibles !== null && cuponesDisponibles <= 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-t-xl">
          <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
            {oferta.rubros?.nombre}
          </span>
          <h1 className="text-3xl font-bold text-white mt-4">{oferta.titulo}</h1>
          <p className="mt-2 text-white/80">{oferta.empresas?.nombre}</p>
        </div>

        {/* Contenido */}
        <div className="p-8">

          {/* Precios */}
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-4xl font-bold text-blue-700">
              ${oferta.precio_oferta.toFixed(2)}
            </span>
            <span className="text-xl text-gray-400 line-through">
              ${oferta.precio_regular.toFixed(2)}
            </span>
            <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
              Ahorras {descuento}%
            </span>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h2>
            <p className="text-gray-600">{oferta.descripcion}</p>
          </div>

          {oferta.otros_detalles && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Otros detalles</h2>
              <p className="text-gray-600">{oferta.otros_detalles}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-500">Oferta válida hasta</p>
              <p className="font-medium text-gray-900">{oferta.fecha_fin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha límite para canjear</p>
              <p className="font-medium text-gray-900">{oferta.fecha_limite_cupon}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cupones vendidos</p>
              <p className="font-medium text-gray-900">{cuponesVendidos}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cupones disponibles</p>
              <p className="font-medium text-gray-900">
                {cuponesDisponibles !== null ? cuponesDisponibles : 'Ilimitados'}
              </p>
            </div>
          </div>

          {/* Sección de compra */}
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Cantidad:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center text-gray-900">
                  {cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad(prev => {
                    if (cuponesDisponibles !== null && prev >= cuponesDisponibles) return prev
                    return prev + 1
                  })}
                  className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleComprar}
              disabled={agotado || processing}
              className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing
                ? 'Procesando...'
                : agotado
                ? 'Agotado — sin cupones disponibles'
                : `Comprar ${cantidad} cupón(es) — $${(oferta.precio_oferta * cantidad).toFixed(2)}`}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
