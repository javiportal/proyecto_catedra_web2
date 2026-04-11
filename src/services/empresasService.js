import { supabase } from '../lib/supabase'

/** Fetch all empresas ordered by name. */
export async function fetchEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data ?? []
}

/**
 * Fetch offer count and employee count for a single empresa.
 * Returns { ofertas: number, empleados: number }
 */
export async function fetchEmpresaStats(empresaId) {
  const [ofertasRes, empleadosRes] = await Promise.all([
    supabase
      .from('ofertas')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId),
    supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .eq('rol', 'empleado'),
  ])
  return {
    ofertas: ofertasRes.count ?? 0,
    empleados: empleadosRes.count ?? 0,
  }
}

/** Insert a new empresa record. */
export async function insertEmpresa(payload) {
  const { error } = await supabase.from('empresas').insert(payload)
  if (error) throw error
}

/** Update an existing empresa record by id. */
export async function updateEmpresa(id, payload) {
  const { error } = await supabase.from('empresas').update(payload).eq('id', id)
  if (error) throw error
}

/** Delete an empresa by id. */
export async function deleteEmpresa(id) {
  const { error } = await supabase.from('empresas').delete().eq('id', id)
  if (error) throw error
}

/**
 * Create a Supabase Auth user and link them to an empresa with rol='empresa'.
 *
 * Uses supabase.auth.signUp which works with the anon key and does NOT
 * affect the currently logged-in admin session in Supabase JS v2.
 *
 * ⚠️  If email confirmation is enabled in the Supabase project settings,
 * the new user must confirm their email before they can log in.
 * You can disable this for development at:
 *   Dashboard → Authentication → Providers → Email → "Confirm email" toggle.
 *
 * @param {string} email
 * @param {string} password  Minimum 6 characters (Supabase requirement).
 * @param {string} nombre    Display name stored in the usuarios table.
 * @param {string} empresaId UUID of the empresa to link.
 */
export async function createEmpresaUser(email, password, nombre, empresaId) {
  // Step 1: Create the Supabase Auth user.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (authError) throw authError

  // Step 2: Insert the profile row that gives them the 'empresa' role.
  const { error: profileError } = await supabase.from('usuarios').insert({
    user_id: authData.user.id,
    nombre,
    rol: 'empresa',
    empresa_id: empresaId,
  })
  if (profileError) throw profileError

  return authData
}
