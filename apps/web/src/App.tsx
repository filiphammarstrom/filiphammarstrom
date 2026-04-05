import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSupabase } from './context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import InboxPage from './pages/InboxPage'
import TodayPage from './pages/TodayPage'
import UpcomingPage from './pages/UpcomingPage'
import AnytimePage from './pages/AnytimePage'
import SomedayPage from './pages/SomedayPage'
import ProjectPage from './pages/ProjectPage'
import AreaPage from './pages/AreaPage'
import AssignedPage from './pages/AssignedPage'
import WorkspacePage from './pages/WorkspacePage'
import QuickAddWindowPage from './pages/QuickAddWindowPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  const supabase = useSupabase()
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [supabase, setSession])

  return (
    <Routes>
      {/* Electron floating quick-add window */}
      <Route path="/quick-add" element={<QuickAddWindowPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="upcoming" element={<UpcomingPage />} />
        <Route path="anytime" element={<AnytimePage />} />
        <Route path="someday" element={<SomedayPage />} />
        <Route path="assigned" element={<AssignedPage />} />
        <Route path="project/:id" element={<ProjectPage />} />
        <Route path="area/:id" element={<AreaPage />} />
        <Route path="workspace" element={<WorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
