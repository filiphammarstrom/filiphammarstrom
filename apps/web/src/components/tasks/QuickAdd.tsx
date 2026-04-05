import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store'
import styles from './QuickAdd.module.css'

export default function QuickAdd() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { create } = useTaskMutations(supabase)
  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('4')
  const [projectId, setProjectId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !user) return

    await create.mutateAsync({
      title: title.trim(),
      notes: notes || null,
      due_date: dueDate || null,
      priority: Number(priority),
      project_id: projectId || null,
      status: 'open',
      user_id: user.id,
      created_by: user.id,
    })

    setTitle('')
    setNotes('')
    setDueDate('')
    setPriority('4')
    setProjectId('')
    setOpen(false)
  }

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Lägg till uppgift (⌘N)"
        title="Lägg till uppgift (⌘N)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.modal} role="dialog" aria-label="Ny uppgift">
            <form onSubmit={submit}>
              <input
                ref={inputRef}
                className={styles.titleInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Uppgiftstitel"
              />
              <textarea
                className={styles.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anteckningar (valfritt)"
                rows={3}
              />
              <div className={styles.row}>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={styles.field}
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.field}
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
                    className={styles.field}
                  >
                    <option value="">Inget projekt</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
                  Avbryt
                </button>
                <button type="submit" className={styles.submit} disabled={!title.trim() || create.isPending}>
                  {create.isPending ? 'Sparar...' : 'Lägg till'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
