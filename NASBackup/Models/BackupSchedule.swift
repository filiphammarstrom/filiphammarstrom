import Foundation

enum BackupSchedule: Codable, Equatable {
    case manual
    case interval(seconds: TimeInterval)   // e.g. every 3600 seconds = hourly
    case daily(hour: Int, minute: Int)     // e.g. every day at 02:00

    var displayName: String {
        switch self {
        case .manual:
            return "Manual only"
        case let .interval(seconds):
            let hours = Int(seconds) / 3600
            let minutes = (Int(seconds) % 3600) / 60
            if hours > 0 && minutes == 0 {
                return "Every \(hours)h"
            } else if hours > 0 {
                return "Every \(hours)h \(minutes)m"
            } else {
                return "Every \(minutes)m"
            }
        case let .daily(hour, minute):
            return String(format: "Daily at %02d:%02d", hour, minute)
        }
    }
}
