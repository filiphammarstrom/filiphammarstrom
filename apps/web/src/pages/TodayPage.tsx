import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useTodayTasks, useTaskMutations } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import styles from './Page.module.css'

export default function TodayPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: tasks = [], isLoading } = useTodayTasks(supabase, user?.id ?? '')
  const { complete } = useTaskMutations(supabase)

  const today = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (isLoading) return <div className={styles.loading}>Laddar...</div>

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Idag</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{today}</p>
      </div>
      <TaskList
        tasks={tasks}
        onComplete={(id) => complete.mutateAsync(id)}
        showAssignee
        emptyText="Inga uppgifter för idag – njut av dagen!"
      />
    </div>
  )
}
