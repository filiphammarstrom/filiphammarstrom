import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  globalShortcut,
  nativeImage,
  Notification,
  ipcMain,
  shell,
  screen,
} from 'electron'
import path from 'path'

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let quickAddWindow: BrowserWindow | null = null

// ──────────────────────────────────────────────
// Main window
// ──────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Todo',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    backgroundColor: '#1c1c1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ──────────────────────────────────────────────
// Quick Add window (lightweight floating modal)
// ──────────────────────────────────────────────
function createQuickAddWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  quickAddWindow = new BrowserWindow({
    width: 520,
    height: 180,
    x: Math.round((width - 520) / 2),
    y: Math.round(height * 0.25),
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#2c2c2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  const url = isDev
    ? 'http://localhost:5173/#/quick-add'
    : `file://${path.join(__dirname, '../dist/index.html')}#/quick-add`

  quickAddWindow.loadURL(url)

  quickAddWindow.once('ready-to-show', () => {
    quickAddWindow!.show()
    quickAddWindow!.focus()
  })

  quickAddWindow.on('blur', () => {
    quickAddWindow?.hide()
  })

  quickAddWindow.on('closed', () => {
    quickAddWindow = null
  })
}

function showQuickAdd() {
  if (!quickAddWindow || quickAddWindow.isDestroyed()) {
    createQuickAddWindow()
  } else if (quickAddWindow.isVisible()) {
    quickAddWindow.hide()
  } else {
    quickAddWindow.show()
    quickAddWindow.focus()
  }
}

// ──────────────────────────────────────────────
// System tray (Mac menu bar / Windows tray)
// ──────────────────────────────────────────────
function createTray() {
  // Use a template image (black icon that adapts to Mac menu bar color)
  const iconPath = isDev
    ? path.join(__dirname, '../assets/tray-icon.png')
    : path.join(process.resourcesPath, 'assets/tray-icon.png')

  const icon = nativeImage.createFromPath(iconPath)
  const trayIcon = isMac ? icon.resize({ width: 16, height: 16 }) : icon.resize({ width: 20, height: 20 })
  if (isMac) trayIcon.setTemplateImage(true)

  tray = new Tray(trayIcon)
  tray.setToolTip('Todo')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Öppna Todo',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createMainWindow()
        }
      },
    },
    {
      label: 'Lägg till uppgift',
      accelerator: isMac ? 'Cmd+Shift+N' : 'Ctrl+Shift+N',
      click: showQuickAdd,
    },
    { type: 'separator' },
    {
      label: 'Avsluta',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    } else {
      createMainWindow()
    }
  })
}

// ──────────────────────────────────────────────
// Application menu
// ──────────────────────────────────────────────
function buildAppMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'Arkiv',
      submenu: [
        {
          label: 'Ny uppgift',
          accelerator: isMac ? 'Cmd+N' : 'Ctrl+N',
          click: () => mainWindow?.webContents.send('quick-add-open'),
        },
        {
          label: 'Lägg till via snabbfönster',
          accelerator: isMac ? 'Cmd+Shift+N' : 'Ctrl+Shift+N',
          click: showQuickAdd,
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'Redigera',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'Visa',
      submenu: [
        { role: 'reload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Fönster',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ──────────────────────────────────────────────
// IPC handlers (renderer → main)
// ──────────────────────────────────────────────
function setupIPC() {
  // Renderer can request to close the quick-add window after task creation
  ipcMain.on('quick-add-close', () => {
    quickAddWindow?.hide()
    mainWindow?.webContents.send('tasks-refresh')
  })

  // Show native desktop notification
  ipcMain.on('notify', (_event, { title, body }: { title: string; body: string }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  // Open the main window from renderer
  ipcMain.on('open-main-window', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createMainWindow()
    }
  })
}

// ──────────────────────────────────────────────
// App lifecycle
// ──────────────────────────────────────────────
app.whenReady().then(() => {
  buildAppMenu()
  setupIPC()
  createMainWindow()
  createTray()

  // Global shortcut: ⌘⇧N (outside app) → Quick Add
  globalShortcut.register(isMac ? 'CommandOrControl+Shift+N' : 'CommandOrControl+Shift+N', showQuickAdd)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  // Keep app alive in tray on Mac; quit on Windows/Linux
  if (!isMac) app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
