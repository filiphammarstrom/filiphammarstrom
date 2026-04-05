import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import styles from './AppShell.module.css'
import QuickAdd from '../tasks/QuickAdd'
import ClaudeChatBar from '../tasks/ClaudeChatBar'

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <QuickAdd />
      <ClaudeChatBar />
    </div>
  )
}
