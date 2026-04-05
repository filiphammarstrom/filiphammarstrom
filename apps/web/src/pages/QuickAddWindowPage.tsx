import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store'

/**
 * Rendered inside the Electron floating quick-add window (hash route #/quick-add).
 * Also works in browser for testing.
 */
export default function QuickAddWindowPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { create } = useTaskMutations(supabase)
  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('4')
  const [projectId, setProjectId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    // Listen for main process open event
    const cleanup = window.electronAPI?.onQuickAddOpen(() => {
      setTitle('')
      inputRef.current?.focus()
    })
    return cleanup
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (window.electronAPI) {
          window.electronAPI.closeQuickAdd()
        } else {
          window.history.back()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !user) return

    await create.mutateAsync({
      title: title.trim(),
      priority: Number(priority),
      project_id: projectId || null,
      status: 'open',
      user_id: user.id,
      created_by: user.id,
    })

    window.electronAPI?.notify('Uppgift tillagd', title.trim())
    window.electronAPI?.closeQuickAdd()
    setTitle('')
  }

  return (
    <div style={{
      padding: '20px 20px 16px',
      background: '#2c2c2e',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      height: '100vh',
      boxSizing: 'border-box',
    }}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lägg till uppgift..."
          style={{
            fontSize: 17,
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #3a3a3c',
            borderRadius: 0,
            color: '#f2f2f7',
            padding: '4px 0 10px',
            outline: 'none',
            width: '100%',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', background: '#3a3a3c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#f2f2f7', fontSize: 13 }}
          >
            <option value="1">P1 – Urgent</option>
            <option value="2">P2 – Hög</option>
            <option value="3">P3 – Medium</option>
            <option value="4">P4 – Låg</option>
          </select>
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', background: '#3a3a3c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#f2f2f7', fontSize: 13 }}
            >
              <option value="">Inget projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            style={{
              padding: '6px 16px',
              background: title.trim() ? '#007aff' : '#3a3a3c',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {create.isPending ? '...' : 'Lägg till'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#636366', margin: 0 }}>
          Esc för att stänga · ⌘⇧N för att öppna igen
        </p>
      </form>
    </div>
  )
}
