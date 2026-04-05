// Type declarations for the Electron preload-exposed API.
// Present when running inside Electron; undefined in browser.
interface ElectronAPI {
  closeQuickAdd: () => void
  notify: (title: string, body: string) => void
  openMainWindow: () => void
  onQuickAddOpen: (cb: () => void) => () => void
  onTasksRefresh: (cb: () => void) => () => void
  platform: string
  isElectron: true
}

interface Window {
  electronAPI?: ElectronAPI
}
