import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useUpcomingTasks, useTaskMutations } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import type { Task } from '@todo/core'
import styles from './Page.module.css'

function groupByDate(tasks: Task[]) {
  const groups: Record<string, Task[]> = {}
  for (const task of tasks) {
    const key = task.due_date ?? 'Inget datum'
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  }
  return groups
}

function formatDateLabel(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('sv-SE', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function UpcomingPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: tasks = [], isLoading } = useUpcomingTasks(supabase, user?.id ?? '')
  const { complete } = useTaskMutations(supabase)

  if (isLoading) return <div className={styles.loading}>Laddar...</div>

  const groups = groupByDate(tasks)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Kommande</h1>
      {Object.keys(groups).length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Inga kommande uppgifter.</p>
      ) : (
        Object.entries(groups).map(([date, dateTasks]) => (
          <section key={date} className={styles.section}>
            <h2 className={styles.sectionTitle}>{formatDateLabel(date)}</h2>
            <TaskList
              tasks={dateTasks}
              onComplete={(id) => complete.mutateAsync(id)}
              showAssignee
            />
          </section>
        ))
      )}
    </div>
  )
}
