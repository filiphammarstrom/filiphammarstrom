import { useState } from 'react'
import type { Task } from '@todo/core'
import styles from './TaskRow.module.css'

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--red)',
  2: 'var(--orange)',
  3: 'var(--yellow)',
  4: 'var(--text-placeholder)',
}

interface Props {
  task: Task
  onComplete: (id: string) => void
  onSelect: (task: Task) => void
  showAssignee?: boolean
  showProject?: boolean
  /** If true, this task is locked (waiting for blocked_by to complete) */
  blocked?: boolean
}

export default function TaskRow({ task, onComplete, onSelect, showAssignee, blocked }: Props) {
  const [checking, setChecking] = useState(false)

  async function handleCheck(e: React.MouseEvent) {
    e.stopPropagation()
    if (blocked) return
    setChecking(true)
    try {
      await onComplete(task.id)
    } finally {
      setChecking(false)
    }
  }

  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`${styles.row} ${isCompleted ? styles.completed : ''} ${blocked ? styles.blocked : ''}`}
      onClick={() => !blocked && onSelect(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !blocked && onSelect(task)}
      aria-label={task.title}
    >
      <button
        className={`${styles.check} ${checking ? styles.checking : ''}`}
        onClick={handleCheck}
        aria-label={isCompleted ? 'Markera som öppen' : 'Slutför uppgift'}
        disabled={blocked}
        style={{ borderColor: PRIORITY_COLORS[task.priority] }}
      >
        {(isCompleted || checking) && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className={styles.content}>
        <span className={styles.title}>{task.title}</span>
        <div className={styles.meta}>
          {blocked && task.blocked_by && (
            <span className={styles.blockedBadge}>
              Väntar på: {task.blocked_by.title}
            </span>
          )}
          {task.due_date && !blocked && (
            <span className={`${styles.dueDate} ${isDue(task.due_date) ? styles.overdue : ''}`}>
              {formatDate(task.due_date)}
            </span>
          )}
          {showAssignee && task.assignee && (
            <span className={styles.assignee} title={task.assignee.full_name ?? task.assignee.email}>
              <Avatar user={task.assignee} size={16} />
            </span>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className={styles.tags}>
              {task.tags.map((tag) => (
                <span key={tag.id} className={styles.tag} style={{ background: tag.color ?? undefined }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Avatar({ user, size }: { user: { full_name: string | null; avatar_url: string | null; email: string }; size: number }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} width={size} height={size} style={{ borderRadius: '50%' }} alt="" />
  }
  const initials = (user.full_name ?? user.email).slice(0, 2).toUpperCase()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent)', color: 'white',
      fontSize: size * 0.45, fontWeight: 600,
    }}>
      {initials}
    </span>
  )
}

function formatDate(date: string) {
  const d = new Date(date)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Idag'
  if (d.toDateString() === tomorrow.toDateString()) return 'Imorgon'
  return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
}

function isDue(date: string) {
  return new Date(date) < new Date()
}
