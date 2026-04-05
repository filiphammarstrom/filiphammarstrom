import { useState, useEffect } from 'react'
import type { Task } from '@todo/core'
import { useSupabase } from '../../context/SupabaseContext'
import { useAuthStore, useTaskMutations, useSubtasks } from '@todo/store'
import styles from './TaskDetailPanel.module.css'

interface Props {
  task: Task
  onClose: () => void
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1 – Urgent',
  2: 'P2 – Hög',
  3: 'P3 – Medium',
  4: 'P4 – Låg',
}
const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--red)',
  2: 'var(--orange)',
  3: 'var(--yellow)',
  4: 'var(--text-placeholder)',
}

export default function TaskDetailPanel({ task, onClose }: Props) {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { update, complete, create } = useTaskMutations(supabase)
  const { data: subtasks = [] } = useSubtasks(supabase, task.id)

  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [priority, setPriority] = useState<number>(task.priority)
  const [newSubtask, setNewSubtask] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync if task prop changes
  useEffect(() => {
    setTitle(task.title)
    setNotes(task.notes ?? '')
    setDueDate(task.due_date ?? '')
    setPriority(task.priority)
  }, [task.id])

  async function save() {
    setSaving(true)
    try {
      await update.mutateAsync({
        id: task.id,
        updates: {
          title,
          notes: notes || null,
          due_date: dueDate || null,
          priority: priority as 1 | 2 | 3 | 4,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    await complete.mutateAsync(task.id)
    onClose()
  }

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubtask.trim() || !user) return
    const lastSubtask = subtasks[subtasks.length - 1]
    await create.mutateAsync({
      title: newSubtask.trim(),
      status: 'open',
      priority: 4,
      parent_task_id: task.id,
      user_id: user.id,
      created_by: user.id,
      workspace_id: task.workspace_id,
      project_id: task.project_id,
      sort_order: subtasks.length,
      // Block by previous subtask if any (sequential ordering)
      blocked_by_task_id: lastSubtask?.id ?? null,
    })
    setNewSubtask('')
  }

  async function completeSubtask(id: string) {
    await complete.mutateAsync(id)
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.panel}>
        <div className={styles.header}>
          <button className={styles.close} onClick={onClose} aria-label="Stäng">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
          <button
            className={styles.completeBtn}
            onClick={handleComplete}
            disabled={task.status === 'completed'}
          >
            {task.status === 'completed' ? 'Slutförd' : 'Slutför uppgift'}
          </button>
        </div>

        <div className={styles.body}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            placeholder="Uppgiftstitel"
          />

          <div className={styles.fields}>
            <label>
              <span>Prioritet</span>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                onBlur={save}
                style={{ color: PRIORITY_COLORS[priority] }}
              >
                {[1, 2, 3, 4].map((p) => (
                  <option key={p} value={p} style={{ color: PRIORITY_COLORS[p] }}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Deadline</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={save}
              />
            </label>
          </div>

          {task.blocked_by && task.blocked_by.status !== 'completed' && (
            <div className={styles.blockInfo}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4v3.5" />
                <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
              </svg>
              Blockerad av: <strong>{task.blocked_by.title}</strong>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Anteckningar</div>
            <textarea
              className={styles.notes}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={save}
              placeholder="Lägg till anteckningar..."
              rows={4}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              Deluppgifter
              {subtasks.length > 0 && <span className={styles.badge}>{subtasks.filter(t => t.status === 'completed').length}/{subtasks.length}</span>}
            </div>
            {subtasks.map((sub, i) => {
              const isBlocked = i > 0 && subtasks[i - 1].status !== 'completed'
              return (
                <div key={sub.id} className={`${styles.subtaskRow} ${isBlocked ? styles.subtaskBlocked : ''}`}>
                  <button
                    className={styles.subtaskCheck}
                    onClick={() => !isBlocked && completeSubtask(sub.id)}
                    disabled={isBlocked || sub.status === 'completed'}
                  >
                    {sub.status === 'completed' && (
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                        <path d="M1 3.5L3 6L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={sub.status === 'completed' ? styles.subtaskDone : ''}>
                    {isBlocked && <span className={styles.lockIcon}>🔒 </span>}
                    {sub.title}
                  </span>
                </div>
              )
            })}
            <form onSubmit={addSubtask} className={styles.addSubtask}>
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Lägg till deluppgift..."
              />
              <button type="submit" disabled={!newSubtask.trim()}>Lägg till</button>
            </form>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerMeta}>
            Skapad {new Date(task.created_at).toLocaleDateString('sv-SE')}
          </span>
          {saving && <span className={styles.saving}>Sparar...</span>}
        </div>
      </aside>
    </>
  )
}
