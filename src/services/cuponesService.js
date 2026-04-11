import { supabase } from '../lib/supabase'

/**
 * Load all data needed for the AdminCupones page in parallel.
 * Returns { cupones, ofertas, empresas, rubros } or throws on error.
 */
export async function fetchAdminCuponesData() {
  const [cuponesRes, ofertasRes, empresasRes, rubrosRes] = await Promise.all([
    supabase
      .from('cupones')
      .select(
        'id, codigo, estado, fecha_compra, fecha_expiracion, ofertas(titulo, descripcion, empresas(nombre))',
      )
      .order('fecha_compra', { ascending: false }),
    supabase
      .from('ofertas')
      .select('id, empresa_id, rubro_id, titulo, descripcion, estado, empresas(id, nombre), rubros(id, nombre)')
      .order('titulo'),
    supabase.from('empresas').select('id, nombre').order('nombre'),
    supabase.from('rubros').select('id, nombre').order('nombre'),
  ])

  const firstError =
    cuponesRes.error || ofertasRes.error || empresasRes.error || rubrosRes.error
  if (firstError) throw firstError

  return {
    cupones: cuponesRes.data ?? [],
    ofertas: ofertasRes.data ?? [],
    empresas: empresasRes.data ?? [],
    rubros: rubrosRes.data ?? [],
  }
}

/** Insert a coupon record. Throws on Supabase error. */
export async function insertCupon(payload) {
  const { error } = await supabase.from('cupones').insert(payload)
  if (error) throw error
}

/** Delete a coupon by id. Throws on Supabase error. */
export async function removeCupon(id) {
  const { error } = await supabase.from('cupones').delete().eq('id', id)
  if (error) throw error
}

/**
 * Create a new offer with estado='APROBADA' (admin quick-create from coupon screen).
 * Returns the new offer row.
 */
export async function insertOfertaAprobada(payload) {
  const { data, error } = await supabase
    .from('ofertas')
    .insert({ ...payload, estado: 'APROBADA' })
    .select('id, empresa_id, rubro_id, titulo, descripcion, estado')
    .single()
  if (error) throw error
  return data
}

/** Set an offer's estado to 'APROBADA'. Throws on error. */
export async function aprobarOferta(id) {
  const { error } = await supabase
    .from('ofertas')
    .update({ estado: 'APROBADA' })
    .eq('id', id)
  if (error) throw error
}
