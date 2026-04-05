import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useProjects, useProjectTasks, useTaskMutations } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import styles from './Page.module.css'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')
  const { data: tasks = [], isLoading } = useProjectTasks(supabase, id ?? '')
  const { complete } = useTaskMutations(supabase)

  const project = projects.find((p) => p.id === id)

  if (isLoading) return <div className={styles.loading}>Laddar...</div>

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {project?.color && (
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: project.color,
              display: 'inline-block',
            }}
          />
        )}
        <h1 className={styles.title}>{project?.name ?? 'Projekt'}</h1>
      </div>
      {project?.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{project.description}</p>
      )}
      <TaskList
        tasks={tasks}
        onComplete={(id) => complete.mutateAsync(id)}
        showAssignee
        emptyText="Inga uppgifter i det här projektet ännu."
      />
    </div>
  )
}
