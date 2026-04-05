import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '../../../apps/web/src/context/SupabaseContext'
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store'

/**
 * Lightweight quick-add form used inside the floating Electron window.
 * Loaded via the #/quick-add hash route.
 */
export default function QuickAddWindow() {
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

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') window.electronAPI?.closeQuickAdd()
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
  }

  return (
    <div style={{
      padding: '16px',
      background: '#2c2c2e',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      height: '100vh',
      boxSizing: 'border-box',
      WebkitAppRegion: 'drag',
    } as React.CSSProperties}>
      <form
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: 10, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
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
          autoFocus
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
              <option value="">Ingen</option>
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
              background: '#007aff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: !title.trim() ? 0.5 : 1,
            }}
          >
            Lägg till
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#636366', margin: 0 }}>Esc för att stänga · ⌘⇧N för att öppna igen</p>
      </form>
    </div>
  )
}
