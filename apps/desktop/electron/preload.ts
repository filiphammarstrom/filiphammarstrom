import { contextBridge, ipcRenderer } from 'electron'

// Expose a safe, narrow API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Close the quick-add floating window after task is created
  closeQuickAdd: () => ipcRenderer.send('quick-add-close'),

  // Send a native desktop notification
  notify: (title: string, body: string) =>
    ipcRenderer.send('notify', { title, body }),

  // Open the main window (e.g. from quick-add)
  openMainWindow: () => ipcRenderer.send('open-main-window'),

  // Listen for events from main process
  onQuickAddOpen: (cb: () => void) => {
    ipcRenderer.on('quick-add-open', cb)
    return () => ipcRenderer.removeListener('quick-add-open', cb)
  },
  onTasksRefresh: (cb: () => void) => {
    ipcRenderer.on('tasks-refresh', cb)
    return () => ipcRenderer.removeListener('tasks-refresh', cb)
  },

  // Platform detection
  platform: process.platform,
  isElectron: true,
})
