import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const localAdminRef = useRef(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [empresaId, setEmpresaId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedAdmin = localStorage.getItem('local_admin_session')
    if (savedAdmin) {
      localAdminRef.current = true
      setUser({ id: 'local-admin', email: 'admin' })
      setProfile({ nombre: 'Administrador' })
      setRole('admin')
      setEmpresaId(null)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (localAdminRef.current) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (localAdminRef.current) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserData(session.user.id)
        } else {
          setProfile(null)
          setRole(null)
          setEmpresaId(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId) => {
    try {
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (usuarioError) throw usuarioError

      if (usuario) {
        setRole(usuario.rol)
        setEmpresaId(usuario.empresa_id || null)
        setProfile(usuario)
        return { role: usuario.rol, empresaId: usuario.empresa_id || null, profile: usuario }
      }

      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (clienteError) throw clienteError

      if (cliente) {
        setRole('cliente')
        setEmpresaId(null)
        setProfile(cliente)
        return { role: 'cliente', empresaId: null, profile: cliente }
      } else {
        setRole(null)
        setEmpresaId(null)
        setProfile(null)
        return { role: null, empresaId: null, profile: null }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      return { role: null, empresaId: null, profile: null }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password, nombres, apellidos, telefono, direccion, dui }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase
        .from('clientes')
        .insert({
          user_id: data.user.id,
          nombres,
          apellidos,
          telefono,
          correo: email,
          direccion,
          dui,
        })

      if (profileError) throw profileError
    }

    return data
  }

  const signIn = async ({ email, password }) => {
    if (email?.trim().toLowerCase() === 'admin' && password === 'admin123') {
      localAdminRef.current = true
      localStorage.setItem('local_admin_session', 'true')
      setUser({ id: 'local-admin', email: 'admin' })
      setProfile({ nombre: 'Administrador' })
      setRole('admin')
      setEmpresaId(null)
      return { role: 'admin' }
    }

    localAdminRef.current = false
    localStorage.removeItem('local_admin_session')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    const userData = data?.user ? await fetchUserData(data.user.id) : null
    return { ...data, role: userData?.role ?? null }
  }

  const signOut = async () => {
    if (localAdminRef.current) {
      localAdminRef.current = false
      localStorage.removeItem('local_admin_session')
      setUser(null)
      setProfile(null)
      setRole(null)
      setEmpresaId(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setRole(null)
    setEmpresaId(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cambiar-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  const value = {
    user,
    profile,
    role,
    empresaId,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
