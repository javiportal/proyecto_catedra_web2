import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminRubros() {
  const [rubros, setRubros] = useState([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchRubros() }, [])

  const fetchRubros = async () => {
    const { data } = await supabase.from('rubros').select('*').order('nombre')
    setRubros(data || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setError('')
    try {
      if (editing) {
        const { error: e } = await supabase.from('rubros').update({ nombre }).eq('id', editing)
        if (e) throw e
        toast.success('Rubro actualizado')
      } else {
        const { error: e } = await supabase.from('rubros').insert({ nombre })
        if (e) throw e
        toast.success('Rubro creado')
      }
      setNombre(''); setEditing(null); fetchRubros()
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este rubro?')) return
    const { error } = await supabase.from('rubros').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Rubro eliminado'); fetchRubros() }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <h1 className="admin-title">Gestión de Rubros</h1>
      <div className="admin-form-card" style={{ maxWidth: 500 }}>
        <div className="form-group">
          <label className="form-label">{editing ? 'Editar Rubro' : 'Nuevo Rubro'}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={`form-input ${error ? 'form-input-error' : ''}`} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del rubro" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            <button className="btn-primary" onClick={handleSubmit}>{editing ? 'Guardar' : 'Crear'}</button>
            {editing && <button className="btn-secondary" onClick={() => { setEditing(null); setNombre('') }}>Cancelar</button>}
          </div>
          {error && <span className="form-error-text">{error}</span>}
        </div>
      </div>
      <div className="admin-table-wrap" style={{ maxWidth: 500 }}>
        <table className="admin-table">
          <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
          <tbody>
            {rubros.map(r => (
              <tr key={r.id}>
                <td className="font-semibold">{r.nombre}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn-sm btn-edit" onClick={() => { setEditing(r.id); setNombre(r.nombre) }}>Editar</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(r.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
