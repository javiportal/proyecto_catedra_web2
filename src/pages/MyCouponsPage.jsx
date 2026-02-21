import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { jsPDF } from 'jspdf'

export default function MyCouponsPage() {
  const { user } = useAuth()
  const [cupones, setCupones] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('disponibles')

  useEffect(() => {
    if (!user?.id) {
      setCupones([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchCupones()
  }, [user?.id])

  const fetchCupones = async () => {
    const { data, error } = await supabase
      .from('cupones')
      .select(`
        *,
        clientes!inner (
          user_id
        ),
        ofertas (
          titulo,
          precio_oferta,
          precio_regular,
          fecha_limite_cupon,
          descripcion,
          empresas (nombre, codigo)
        )
      `)
      .eq('clientes.user_id', user.id)
      .order('fecha_compra', { ascending: false })

    if (error) {
      console.error('Error fetching cupones:', error)
      setCupones([])
      setLoading(false)
      return
    }

    setCupones((data ?? []).map(({ clientes, ...cupon }) => cupon))
    setLoading(false)
  }

  const hoy = new Date().toISOString().split('T')[0]

  const cuponesDisponibles = cupones.filter(
    c => c.estado === 'disponible' && c.ofertas?.fecha_limite_cupon >= hoy
  )
  const cuponesCanjeados = cupones.filter(c => c.estado === 'canjeado')
  const cuponesVencidos = cupones.filter(
    c => c.estado === 'disponible' && c.ofertas?.fecha_limite_cupon < hoy
  )

  const tabs = [
    { id: 'disponibles', label: 'Disponibles', count: cuponesDisponibles.length },
    { id: 'canjeados', label: 'Canjeados', count: cuponesCanjeados.length },
    { id: 'vencidos', label: 'Vencidos', count: cuponesVencidos.length },
  ]

  const cuponesActuales =
    tab === 'disponibles' ? cuponesDisponibles :
    tab === 'canjeados' ? cuponesCanjeados :
    cuponesVencidos

  const generarPDF = (cupon) => {
    const doc = new jsPDF()

    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, 210, 50, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.text('La Cuponera', 105, 22, { align: 'center' })
    doc.setFontSize(12)
    doc.text('Cupón de Descuento', 105, 35, { align: 'center' })

    // Body
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(18)
    doc.text(cupon.ofertas.titulo, 105, 70, { align: 'center' })

    doc.setFontSize(12)
    doc.text(`Empresa: ${cupon.ofertas.empresas.nombre}`, 20, 90)
    doc.text(`Codigo del cupon: ${cupon.codigo}`, 20, 102)
    doc.text(`Precio oferta: $${cupon.ofertas.precio_oferta.toFixed(2)}`, 20, 114)
    doc.text(`Precio regular: $${cupon.ofertas.precio_regular.toFixed(2)}`, 20, 126)
    doc.text(`Fecha de compra: ${new Date(cupon.fecha_compra).toLocaleDateString('es-SV')}`, 20, 138)
    doc.text(`Valido hasta: ${cupon.ofertas.fecha_limite_cupon}`, 20, 150)

    // Código grande
    doc.setFillColor(243, 244, 246)
    doc.roundedRect(30, 165, 150, 30, 5, 5, 'F')
    doc.setFontSize(20)
    doc.setTextColor(37, 99, 235)
    doc.text(cupon.codigo, 105, 184, { align: 'center' })

    // Footer
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('Presente este cupon junto con su DUI en el establecimiento.', 105, 210, { align: 'center' })

    doc.save(`cupon-${cupon.codigo}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mis Cupones</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Lista de cupones */}
      {cuponesActuales.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No tienes cupones en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cuponesActuales.map(cupon => (
            <div
              key={cupon.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex"
            >
              <div className={`w-2 ${
                tab === 'disponibles' ? 'bg-green-500' :
                tab === 'canjeados' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />

              <div className="flex-1 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cupon.ofertas?.titulo}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cupon.ofertas?.empresas?.nombre}</p>
                  </div>
                  <span className="text-xl font-bold text-blue-700">
                    ${cupon.ofertas?.precio_oferta?.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span> {cupon.codigo}</span>
                  <span> Compra: {new Date(cupon.fecha_compra).toLocaleDateString('es-SV')}</span>
                  <span> Válido hasta: {cupon.ofertas?.fecha_limite_cupon}</span>
                </div>

                {tab === 'disponibles' && (
                  <button
                    onClick={() => generarPDF(cupon)}
                    className="mt-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100"
                  >
                    Descargar PDF
                  </button>
                )}

                {tab === 'canjeados' && (
                  <span className="mt-3 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    Canjeado
                  </span>
                )}

                {tab === 'vencidos' && (
                  <span className="mt-3 inline-block bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">
                    Vencido
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
