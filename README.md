# NASBackup

A native macOS backup app inspired by Carbon Copy Cloner 7. Lives in the menu bar and automatically backs up your files to a NAS over SMB or SSH/rsync.

## Features

- **Incremental backups** — only transfers new or changed files using rsync
- **SafetyNet versioning** — before overwriting a file, the old version is moved to a dated snapshot folder (`.safetynet/YYYY-MM-DD_HHmmss/`). No file is duplicated unless it actually changed.
- **Configurable retention** — automatically prune snapshots older than N days, with an optional hard cap on the number of versions kept
- **Auto-start on home network** — detects your home Wi-Fi SSID and starts the backup automatically when you arrive home
- **Sleep/wake resume** — suspends rsync (SIGSTOP) when your Mac sleeps and resumes it (SIGCONT) on wake. If rsync was killed, `--partial-dir` picks up where it left off
- **File filters** — exclude patterns, include patterns, hidden files, and max file size
- **Dual NAS support** — SMB (mounted volume) or SSH/rsync direct
- **Menu bar only** — no Dock icon

## Requirements

- macOS 13 Ventura or later
- Xcode 15+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`
- rsync 3.x (macOS built-in works; for better performance: `brew install rsync`)

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/filiphammarstrom/filiphammarstrom.git
cd filiphammarstrom

# 2. Generate the Xcode project
make project        # or: xcodegen generate

# 3. Open in Xcode
make open           # or: open NASBackup.xcodeproj
```

Then build and run (`⌘R`) from Xcode. The app will appear in your menu bar.

## First-time setup

1. Click the menu bar icon → **Settings…**
2. Go to the **Tasks** tab → click **+** to add a backup task
3. Choose your source folder and NAS destination (SMB or SSH)
4. Optionally configure a **Network** trigger (your home SSID) and a **Schedule**
5. Click **Back Up Now** to test

### Granting Full Disk Access

For backing up folders like `~/Library`, grant Full Disk Access to NASBackup in:  
**System Settings → Privacy & Security → Full Disk Access**

## Architecture

```
NASBackup/
├── App/            NASBackupApp (MenuBarExtra), AppDelegate, AppEnvironment
├── Models/         BackupTask, BackupRun, BackupFilter, RetentionPolicy, …
├── Services/
│   ├── RsyncRunner        builds + runs rsync, streams output
│   ├── BackupEngine       orchestrates a full backup run
│   ├── RetentionManager   prunes old SafetyNet snapshots
│   ├── NetworkMonitor     NWPathMonitor + CoreWLAN SSID detection
│   ├── SleepWakeObserver  suspend/resume on macOS sleep/wake
│   ├── MountManager       programmatic SMB mount via mount_smbfs
│   ├── ScheduleManager    timer + network triggers
│   └── ConfigurationStore JSON config + Keychain passwords
└── UI/
    ├── MenuBar/    Popover with status + quick actions
    └── Settings/   Tasks, Filters, Retention, Network, History, General tabs
```

## rsync strategy

Each backup run:

```
rsync --archive --partial --partial-dir=.rsync_partial
      --delete --delete-excluded
      --backup --backup-dir=.safetynet/2026-04-05_143022
      [filters]
      /source/path/
      /Volumes/NAS/dest/          # SMB
      # or user@nas:/remote/path/ # SSH
```

- `--partial` / `--partial-dir` → resume partial transfers after sleep/interruption
- `--backup` / `--backup-dir` → SafetyNet: old versions are archived, not deleted
- `--delete` → destination mirrors source (deleted files are moved to SafetyNet, not lost)

## License

MIT
