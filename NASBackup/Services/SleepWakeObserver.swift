import Foundation
import AppKit
import OSLog

/// Observes macOS sleep and wake notifications, pausing and resuming the backup engine accordingly.
final class SleepWakeObserver {

    private var sleepObserver: NSObjectProtocol?
    private var wakeObserver: NSObjectProtocol?
    private weak var engine: BackupEngine?
    private weak var networkMonitor: NetworkMonitor?
    private weak var scheduleManager: ScheduleManager?
    private var tasks: (() -> [BackupTask])?

    func start(
        engine: BackupEngine,
        networkMonitor: NetworkMonitor,
        scheduleManager: ScheduleManager,
        tasks: @escaping () -> [BackupTask]
    ) {
        self.engine = engine
        self.networkMonitor = networkMonitor
        self.scheduleManager = scheduleManager
        self.tasks = tasks

        let center = NSWorkspace.shared.notificationCenter

        sleepObserver = center.addObserver(
            forName: NSWorkspace.willSleepNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleSleep()
        }

        wakeObserver = center.addObserver(
            forName: NSWorkspace.didWakeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleWake()
        }

        Logger.app.info("SleepWakeObserver started")
    }

    func stop() {
        if let obs = sleepObserver { NSWorkspace.shared.notificationCenter.removeObserver(obs) }
        if let obs = wakeObserver  { NSWorkspace.shared.notificationCenter.removeObserver(obs) }
    }

    // MARK: - Handlers

    private func handleSleep() {
        Logger.app.info("System going to sleep — suspending backup if active")
        Task { @MainActor in
            engine?.suspend()
        }
    }

    private func handleWake() {
        Logger.app.info("System woke — checking for resume")
        // Give the network a moment to reconnect before attempting resume
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 3_000_000_000) // 3 s
            guard let tasks = tasks?() else { return }
            engine?.resumeIfNeeded(tasks: tasks)

            // Re-evaluate network triggers in case we're back on home network
            if let ssid = networkMonitor?.currentSSID {
                scheduleManager?.evaluateTriggers(tasks: tasks, currentSSID: ssid)
            }
        }
    }
}
