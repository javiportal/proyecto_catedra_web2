import { supabase } from '../lib/supabase'

// ─── Public / shared queries ──────────────────────────────────

/**
 * Fetch all APROBADA offers that are still within their date range,
 * with their rubro and empresa joined.
 * Used by the public home page and the "Ofertas por Rubro" page.
 */
export async function fetchOfertasAprobadasVigentes() {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('ofertas')
    .select(`
      id,
      titulo,
      descripcion,
      precio_regular,
      precio_oferta,
      fecha_inicio,
      fecha_fin,
      rubros:rubros ( id, nombre )
    `)
    .eq('estado', 'APROBADA')
    .or(`fecha_fin.is.null,fecha_fin.gte.${today}`)
    .order('rubro_id', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Group an array of offers by rubro name. Returns { [rubroName]: offer[] } */
export function agruparPorRubro(ofertas) {
  const grouped = {}
  for (const o of ofertas) {
    const rubro = o?.rubros?.nombre ?? 'Sin rubro'
    if (!grouped[rubro]) grouped[rubro] = []
    grouped[rubro].push(o)
  }
  return grouped
}

// ─── Empresa-scoped queries ───────────────────────────────────

/**
 * Fetch all offers belonging to a single empresa, newest first.
 * Includes the rubro name.
 */
export async function fetchEmpresaOfertas(empresaId) {
  const { data, error } = await supabase
    .from('ofertas')
    .select('*, rubros(nombre)')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Fetch all rubros ordered by name (used in empresa offer form). */
export async function fetchRubros() {
  const { data, error } = await supabase
    .from('rubros')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data ?? []
}

/**
 * Insert a new offer. Empresa-created offers always start as PENDIENTE.
 */
export async function insertOferta(payload) {
  const { error } = await supabase.from('ofertas').insert(payload)
  if (error) throw error
}

/**
 * Update an existing offer by id.
 * The `estado` field is stripped from payload on empresa edits (cannot
 * change their own approval state); pass the full payload for admin updates.
 */
export async function updateOferta(id, payload) {
  const { error } = await supabase.from('ofertas').update(payload).eq('id', id)
  if (error) throw error
}

/** Delete an offer by id. */
export async function deleteOferta(id) {
  const { error } = await supabase.from('ofertas').delete().eq('id', id)
  if (error) throw error
}
