import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [empresaId, setEmpresaId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUserData(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchUserData(session.user.id)
        else { setProfile(null); setRole(null); setEmpresaId(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId) => {
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (usuario) {
        setRole(usuario.rol)
        setEmpresaId(usuario.empresa_id || null)
        setProfile(usuario)
      } else {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        if (cliente) { setRole('cliente'); setProfile(cliente) }
        else { setRole(null); setProfile(null) }
      }
    } catch (e) { console.error('Error fetching user data:', e) }
    finally { setLoading(false) }
  }

  const signUp = async ({ email, password, nombres, apellidos, telefono, direccion, dui }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      const { error: pe } = await supabase.from('clientes').insert({
        user_id: data.user.id, nombres, apellidos, telefono, correo: email, direccion, dui,
      })
      if (pe) throw pe
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setRole(null); setEmpresaId(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, role, empresaId, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
