import Foundation

enum RunStatus: Codable, Equatable {
    case running
    case completed
    case failed(String)
    case interrupted
}

struct ResumeState: Codable, Equatable {
    var taskId: UUID
    var interruptedAt: Date
    var partialDir: String     // path to --partial-dir contents on destination
}

struct BackupRun: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var taskId: UUID
    var taskName: String
    var startedAt: Date
    var finishedAt: Date?
    var status: RunStatus
    var bytesCopied: Int64
    var filesTransferred: Int
    var filesSkipped: Int
    var logLines: [String]        // capped last N lines from rsync output
    var resumeState: ResumeState?

    static let maxLogLines = 500

    var duration: TimeInterval? {
        guard let end = finishedAt else { return nil }
        return end.timeIntervalSince(startedAt)
    }

    var formattedDuration: String {
        guard let d = duration else { return "—" }
        let mins = Int(d) / 60
        let secs = Int(d) % 60
        return mins > 0 ? "\(mins)m \(secs)s" : "\(secs)s"
    }

    var formattedBytes: String {
        ByteCountFormatter.string(fromByteCount: bytesCopied, countStyle: .file)
    }
}
