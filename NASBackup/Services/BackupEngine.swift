import Foundation
import OSLog
import UserNotifications

/// Orchestrates a full backup run for one BackupTask.
@MainActor
final class BackupEngine: ObservableObject {

    @Published private(set) var activeRun: BackupRun?
    @Published private(set) var currentFile: String = ""
    @Published private(set) var progressPercent: Int = 0

    private var rsyncRunner: RsyncRunner?
    private var runTask: Task<Void, Never>?
    private let mountManager = MountManager()
    private let retentionManager = RetentionManager()
    private let store: ConfigurationStore
    private var isSuspended = false

    init(store: ConfigurationStore) {
        self.store = store
    }

    var isRunning: Bool { activeRun?.status == .running }

    // MARK: - Start

    func start(task: BackupTask) {
        guard !isRunning else { return }

        var run = BackupRun(
            taskId: task.id,
            taskName: task.name,
            startedAt: Date(),
            finishedAt: nil,
            status: .running,
            bytesCopied: 0,
            filesTransferred: 0,
            filesSkipped: 0,
            logLines: []
        )
        activeRun = run

        runTask = Task {
            do {
                // Mount SMB if needed
                if case let .smb(host, share, mountPoint, username, keychainLabel) = task.destination {
                    try await mountManager.mount(
                        host: host, share: share, mountPoint: mountPoint,
                        username: username, keychainLabel: keychainLabel
                    )
                }

                let rsync = try RsyncRunner()
                rsyncRunner = rsync

                let snapshotDate = Date()
                let args = rsync.buildArguments(task: task, snapshotDate: snapshotDate)
                Logger.backup.info("Starting backup: \(task.name)")

                var logLines: [String] = []
                var bytesCopied: Int64 = 0
                var filesTransferred = 0

                let exitCode = try await rsync.run(arguments: args) { [weak self] line in
                    guard let self else { return }
                    Task { @MainActor in
                        logLines.append(line)
                        if logLines.count > BackupRun.maxLogLines {
                            logLines.removeFirst()
                        }

                        // Parse progress line
                        if let progress = RsyncRunner.parseStatLine(line) {
                            self.progressPercent = progress.percentComplete
                            bytesCopied = max(bytesCopied, progress.bytesTotal)
                        } else if !line.hasPrefix(" ") && !line.hasPrefix("sending") && !line.hasPrefix("sent") {
                            self.currentFile = line
                            filesTransferred += 1
                        }

                        self.activeRun?.logLines = logLines
                        self.activeRun?.bytesCopied = bytesCopied
                        self.activeRun?.filesTransferred = filesTransferred
                    }
                }

                rsyncRunner = nil

                if exitCode == 0 || exitCode == 24 /* partial transfer */ {
                    // Prune old snapshots
                    if task.retentionPolicy.safetyNetEnabled && task.retentionPolicy.pruneAfterBackup {
                        try await retentionManager.prune(task: task)
                    }

                    run.status = .completed
                    run.finishedAt = Date()
                    run.logLines = logLines
                    run.bytesCopied = bytesCopied
                    run.filesTransferred = filesTransferred
                    Logger.backup.info("Backup completed: \(task.name), \(filesTransferred) files, \(bytesCopied) bytes")
                    sendNotification(title: "Backup complete", body: "\(task.name): \(filesTransferred) files transferred.")
                } else {
                    let errMsg = "rsync exited with code \(exitCode)"
                    run.status = .failed(errMsg)
                    run.finishedAt = Date()
                    Logger.backup.error("Backup failed: \(errMsg)")
                    sendNotification(title: "Backup failed", body: "\(task.name): \(errMsg)")
                }

            } catch {
                run.status = .failed(error.localizedDescription)
                run.finishedAt = Date()
                Logger.backup.error("Backup error: \(error.localizedDescription)")
                sendNotification(title: "Backup error", body: "\(task.name): \(error.localizedDescription)")
            }

            activeRun = run
            store.saveResumeState(nil)
            progressPercent = 0
            currentFile = ""
        }
    }

    // MARK: - Suspend / Resume (sleep/wake)

    func suspend() {
        guard isRunning, let run = activeRun else { return }
        rsyncRunner?.suspend()
        isSuspended = true

        let state = ResumeState(
            taskId: run.taskId,
            interruptedAt: Date(),
            partialDir: ".rsync_partial"
        )
        store.saveResumeState(state)
        Logger.backup.info("Backup suspended for task \(run.taskId)")
    }

    func resumeIfNeeded(tasks: [BackupTask]) {
        guard isSuspended else { return }

        if let runner = rsyncRunner, runner.processId > 0 {
            // Process is still alive — just resume it
            runner.resume()
            isSuspended = false
            Logger.backup.info("Backup resumed (SIGCONT)")
        } else if let state = store.loadResumeState(),
                  let task = tasks.first(where: { $0.id == state.taskId }) {
            // Process was killed — restart rsync (--partial-dir handles the rest)
            isSuspended = false
            store.saveResumeState(nil)
            Logger.backup.info("Restarting backup after wake for task \(task.name)")
            start(task: task)
        }
    }

    // MARK: - Cancel

    func cancel() {
        rsyncRunner?.terminate()
        runTask?.cancel()
        activeRun?.status = .interrupted
        activeRun?.finishedAt = Date()
        store.saveResumeState(nil)
        progressPercent = 0
        currentFile = ""
    }

    // MARK: - Notifications

    private func sendNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request)
    }
}
