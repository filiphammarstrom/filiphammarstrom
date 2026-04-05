import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useAnytimeTasks, useTaskMutations } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import styles from './Page.module.css'

export default function AnytimePage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: tasks = [], isLoading } = useAnytimeTasks(supabase, user?.id ?? '')
  const { complete } = useTaskMutations(supabase)

  if (isLoading) return <div className={styles.loading}>Laddar...</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Närsomhelst</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Uppgifter i projekt utan deadline
      </p>
      <TaskList
        tasks={tasks}
        onComplete={(id) => complete.mutateAsync(id)}
        showAssignee
        emptyText="Inga uppgifter här."
      />
    </div>
  )
}
