// Type declarations for the preload-exposed API
interface ElectronAPI {
  closeQuickAdd: () => void
  notify: (title: string, body: string) => void
  openMainWindow: () => void
  onQuickAddOpen: (cb: () => void) => () => void
  onTasksRefresh: (cb: () => void) => () => void
  platform: NodeJS.Platform
  isElectron: true
}

declare interface Window {
  electronAPI?: ElectronAPI
}
