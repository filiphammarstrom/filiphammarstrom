import { useState, useRef, useEffect } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store'
import styles from './ClaudeChatBar.module.css'

interface ParsedTask {
  title: string
  dueDate?: string
  priority?: 1 | 2 | 3 | 4
  projectName?: string
  notes?: string
  tags?: string[]
  subtasks?: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  tasks?: ParsedTask[]
}

export default function ClaudeChatBar() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { create } = useTaskMutations(supabase)
  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // Keyboard shortcut: ⌘K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || !user) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('claude-task', {
        body: { text: userMsg, userId: user.id },
      })

      if (error) throw error

      const parsed: ParsedTask[] = Array.isArray(data.tasks) ? data.tasks : [data.task].filter(Boolean)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.message ?? `Hittade ${parsed.length} uppgift(er). Vill du lägga till dem?`,
          tasks: parsed,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Fel: Kunde inte tolka uppgiften. Försök igen.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function createParsedTasks(tasks: ParsedTask[]) {
    for (const task of tasks) {
      const project = task.projectName
        ? projects.find((p) => p.name.toLowerCase().includes(task.projectName!.toLowerCase()))
        : undefined

      await create.mutateAsync({
        title: task.title,
        notes: task.notes ?? null,
        due_date: task.dueDate ?? null,
        priority: task.priority ?? 4,
        project_id: project?.id ?? null,
        status: 'open',
        user_id: user!.id,
        created_by: user!.id,
      })
    }
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: `${tasks.length} uppgift(er) har lagts till!` },
    ])
  }

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => setOpen(true)}
        title="Fråga Claude (⌘K)"
        aria-label="Fråga Claude"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2C5.134 2 2 5.134 2 9s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 7.5C6 6.12 7.12 5 8.5 5c1.38 0 2.5 1.12 2.5 2.5 0 1.5-1.5 2-1.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="9" cy="13.5" r="0.75" fill="currentColor" />
        </svg>
        Claude
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.panel} role="dialog" aria-label="Claude AI">
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect width="16" height="16" rx="4" fill="#CC785C" />
                  <path d="M4 12L8 4L12 12M5.5 9h5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Claude AI
              </div>
              <button className={styles.close} onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className={styles.messages} ref={listRef}>
              {messages.length === 0 && (
                <div className={styles.welcome}>
                  <p>Hej! Beskriv uppgifter med naturligt språk.</p>
                  <p className={styles.examples}>
                    <em>Exempel: "Köp mjölk imorgon P2 i projekt Hem"</em><br />
                    <em>"Skapa subtasks för hemsida: design, kod, test"</em>
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                  <p>{msg.text}</p>
                  {msg.tasks && msg.tasks.length > 0 && (
                    <div className={styles.taskPreview}>
                      {msg.tasks.map((t, j) => (
                        <div key={j} className={styles.taskChip}>
                          <span className={styles.taskChipPriority} style={{
                            background: t.priority === 1 ? 'var(--red)' : t.priority === 2 ? 'var(--orange)' : t.priority === 3 ? 'var(--yellow)' : 'var(--text-placeholder)'
                          }}>
                            P{t.priority ?? 4}
                          </span>
                          {t.title}
                          {t.dueDate && <span className={styles.taskChipDate}>{t.dueDate}</span>}
                        </div>
                      ))}
                      <button
                        className={styles.createBtn}
                        onClick={() => createParsedTasks(msg.tasks!)}
                        disabled={create.isPending}
                      >
                        Lägg till alla
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <span className={styles.typing}>•••</span>
                </div>
              )}
            </div>

            <form className={styles.inputRow} onSubmit={sendMessage}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Skriv en uppgift eller fråga Claude..."
                disabled={loading}
              />
              <button type="submit" disabled={!input.trim() || loading}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}
    </>
  )
}
