import Foundation
import OSLog

/// Manages timer-based and network-triggered backup scheduling.
@MainActor
final class ScheduleManager: ObservableObject {

    private var timers: [UUID: Task<Void, Never>] = [:]
    private var pendingNetworkTriggers: [UUID: Task<Void, Never>] = [:]
    weak var engine: BackupEngine?

    // MARK: - Schedule management

    func reschedule(tasks: [BackupTask]) {
        // Cancel all existing timers
        timers.values.forEach { $0.cancel() }
        timers.removeAll()

        for task in tasks where task.isEnabled {
            switch task.schedule {
            case .manual:
                break

            case let .interval(seconds):
                let t = Task {
                    while !Task.isCancelled {
                        try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                        if !Task.isCancelled {
                            Logger.schedule.info("Interval trigger for task: \(task.name)")
                            self.engine?.start(task: task)
                        }
                    }
                }
                timers[task.id] = t

            case let .daily(hour, minute):
                let t = Task {
                    while !Task.isCancelled {
                        let delay = Self.secondsUntil(hour: hour, minute: minute)
                        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                        if !Task.isCancelled {
                            Logger.schedule.info("Daily trigger for task: \(task.name)")
                            self.engine?.start(task: task)
                        }
                    }
                }
                timers[task.id] = t
            }
        }
    }

    // MARK: - Network trigger

    func evaluateTriggers(tasks: [BackupTask], currentSSID: String?) {
        guard let ssid = currentSSID else {
            // Disconnected — cancel all pending triggers
            pendingNetworkTriggers.values.forEach { $0.cancel() }
            pendingNetworkTriggers.removeAll()
            return
        }

        for task in tasks where task.isEnabled {
            guard let trigger = task.networkTrigger, trigger.ssid == ssid else { continue }
            guard pendingNetworkTriggers[task.id] == nil else { continue }

            Logger.schedule.info("Network trigger queued for \(task.name) (delay \(trigger.delaySeconds)s)")
            let t = Task {
                try? await Task.sleep(nanoseconds: UInt64(trigger.delaySeconds) * 1_000_000_000)
                if !Task.isCancelled {
                    Logger.schedule.info("Network trigger firing for \(task.name)")
                    self.engine?.start(task: task)
                }
                self.pendingNetworkTriggers.removeValue(forKey: task.id)
            }
            pendingNetworkTriggers[task.id] = t
        }
    }

    // MARK: - Helpers

    private static func secondsUntil(hour: Int, minute: Int) -> TimeInterval {
        let cal = Calendar.current
        var components = cal.dateComponents([.year, .month, .day], from: Date())
        components.hour = hour
        components.minute = minute
        components.second = 0

        guard var next = cal.date(from: components) else { return 86400 }
        if next <= Date() {
            next = cal.date(byAdding: .day, value: 1, to: next) ?? next
        }
        return next.timeIntervalSinceNow
    }
}
