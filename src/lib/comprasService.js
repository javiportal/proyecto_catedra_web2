import { supabase } from './supabase'

export async function registrarCompra({
  cuponId,
  clienteId,
  ofertaId,
  empresaId,
  monto,
  cantidad,
  metodoPago = 'en_linea',
  estado = 'completada',
}) {
  const now = new Date()
  const fechaCompra = now.toISOString().slice(0, 10)
  const horaCompra = now.toTimeString().slice(0, 8)

  const { data, error } = await supabase
    .from('compras')
    .insert({
      cupon_id: cuponId,
      cliente_id: clienteId,
      oferta_id: ofertaId,
      empresa_id: empresaId,
      fecha_compra: fechaCompra,
      hora_compra: horaCompra,
      fecha_hora_compra: now.toISOString(),
      monto,
      metodo_pago: metodoPago,
      estado,
      cantidad,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
