import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useInboxTasks, useTaskMutations } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import styles from './Page.module.css'

export default function InboxPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: allTasks = [], isLoading } = useInboxTasks(supabase, user?.id ?? '')
  const { complete } = useTaskMutations(supabase)

  if (isLoading) return <div className={styles.loading}>Laddar...</div>

  const today = new Date().toISOString().slice(0, 10)
  const idag = allTasks.filter(
    (t) => t.due_date === today || t.start_date === today,
  )
  const inkorg = allTasks.filter(
    (t) => t.due_date !== today && t.start_date !== today,
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Inkorg</h1>

      {idag.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Idag</h2>
          <TaskList
            tasks={idag}
            onComplete={(id) => complete.mutateAsync(id)}
            emptyText="Inga uppgifter för idag"
          />
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {idag.length > 0 ? 'Osorterat' : 'Inkorg'}
        </h2>
        <TaskList
          tasks={inkorg}
          onComplete={(id) => complete.mutateAsync(id)}
          emptyText="Inkorg är tom – bra jobbat!"
        />
      </section>
    </div>
  )
}
