import { useParams } from 'react-router-dom'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useAreas, useProjects, useTaskMutations, useProjectTasks } from '@todo/store'
import TaskList from '../components/tasks/TaskList'
import { NavLink } from 'react-router-dom'
import styles from './Page.module.css'

export default function AreaPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: areas = [] } = useAreas(supabase, user?.id ?? '')
  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')

  const area = areas.find((a) => a.id === id)
  const areaProjects = projects.filter((p) => p.area_id === id && p.status === 'active')

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {area?.color && (
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: area.color,
              display: 'inline-block',
            }}
          />
        )}
        <h1 className={styles.title}>{area?.name ?? 'Område'}</h1>
      </div>

      {areaProjects.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Inga aktiva projekt i det här området.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {areaProjects.map((project) => (
            <NavLink
              key={project.id}
              to={`/project/${project.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                textDecoration: 'none',
              }}
            >
              {project.color && (
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: project.color, display: 'inline-block' }} />
              )}
              {project.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
