import { NavLink, useNavigate } from 'react-router-dom'
import { useSupabase } from '../../context/SupabaseContext'
import { useAuthStore, useProjects, useAreas } from '@todo/store'
import styles from './Sidebar.module.css'

const ICONS = {
  inbox: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 9.5V12a2 2 0 01-2 2H4a2 2 0 01-2-2V9.5l2-4h8l2 4zM1 9.5h4l1 2h4l1-2h4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  today: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="12" rx="2" />
      <path d="M5 1v3M11 1v3M2 7h12" />
      <text x="5" y="13" fill="currentColor" stroke="none" fontSize="6" fontWeight="bold">
        {new Date().getDate()}
      </text>
    </svg>
  ),
  upcoming: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M8 2v4l3 3" />
      <circle cx="8" cy="8" r="6" />
    </svg>
  ),
  anytime: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2 8h12M8 2l6 6-6 6" />
    </svg>
  ),
  someday: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M8 3l1.5 3 3.5.5-2.5 2.5.5 3.5L8 11l-3 1.5.5-3.5L3 7l3.5-.5z" />
    </svg>
  ),
  assigned: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" />
    </svg>
  ),
  area: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="1" y="1" width="12" height="12" rx="2" />
    </svg>
  ),
  project: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" />
      <path d="M7 4v3l2 2" />
    </svg>
  ),
}

export default function Sidebar() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: projects = [] } = useProjects(supabase, user?.id ?? '')
  const { data: areas = [] } = useAreas(supabase, user?.id ?? '')

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const link = (to: string, label: string, icon: React.ReactNode) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.icon}>{icon}</span>
      {label}
    </NavLink>
  )

  return (
    <nav className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.appName}>Todo</div>
        <div className={styles.section}>
          {link('/inbox', 'Inkorg', ICONS.inbox)}
          {link('/today', 'Idag', ICONS.today)}
          {link('/upcoming', 'Kommande', ICONS.upcoming)}
          {link('/anytime', 'Närsomhelst', ICONS.anytime)}
          {link('/someday', 'Someday', ICONS.someday)}
          {link('/assigned', 'Tilldelade till mig', ICONS.assigned)}
        </div>

        {areas.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Områden</div>
            {areas.map((area) => (
              <NavLink
                key={area.id}
                to={`/area/${area.id}`}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.icon} style={{ color: area.color ?? undefined }}>
                  {ICONS.area}
                </span>
                {area.name}
              </NavLink>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Projekt</div>
            {projects
              .filter((p) => p.status === 'active')
              .map((project) => (
                <NavLink
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.icon} style={{ color: project.color ?? undefined }}>
                    {ICONS.project}
                  </span>
                  {project.name}
                </NavLink>
              ))}
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        <NavLink
          to="/workspace"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
          </span>
          Team & Workspace
        </NavLink>
        <button className={styles.signOut} onClick={signOut}>
          Logga ut
        </button>
      </div>
    </nav>
  )
}
