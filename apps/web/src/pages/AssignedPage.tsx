import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useAssignedToMeTasks, useTaskMutations } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import styles from './Page.module.css'

export default function AssignedPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: tasks = [], isLoading } = useAssignedToMeTasks(supabase, user?.id ?? '')
  const { complete } = useTaskMutations(supabase)

  if (isLoading) return <div className={styles.loading}>Laddar...</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tilldelade till mig</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Uppgifter som kollegor har tilldelat dig
      </p>
      <TaskList
        tasks={tasks}
        onComplete={(id) => complete.mutateAsync(id)}
        showAssignee
        emptyText="Inga uppgifter tilldelade till dig."
      />
    </div>
  )
}
