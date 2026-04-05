import Foundation
import OSLog

/// Streams rsync output line-by-line and reports parsed progress.
final class RsyncRunner {

    struct Progress {
        var currentFile: String
        var percentComplete: Int      // 0-100 for current file
        var speed: String
        var bytesTotal: Int64
    }

    private var process: Process?
    private(set) var processId: pid_t = 0
    private let rsyncPath: String

    init() throws {
        // Prefer Homebrew rsync (newer) over macOS built-in if available
        let candidates = ["/opt/homebrew/bin/rsync", "/usr/local/bin/rsync", "/usr/bin/rsync"]
        guard let path = candidates.first(where: { FileManager.default.isExecutableFile(atPath: $0) }) else {
            throw NASBackupError.rsyncNotFound
        }
        rsyncPath = path
    }

    /// Builds the rsync argument list for the given task and backup run date.
    func buildArguments(task: BackupTask, snapshotDate: Date) -> [String] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd_HHmmss"
        let snapshotName = formatter.string(from: snapshotDate)

        var args: [String] = [
            "--archive",
            "--verbose",
            "--human-readable",
            "--progress",
            "--partial",
            "--partial-dir=.rsync_partial",
            "--delay-updates",
            "--delete",
            "--delete-excluded",
            "--stats"
        ]

        // SafetyNet versioning
        if task.retentionPolicy.safetyNetEnabled {
            let safetyNetDir = task.retentionPolicy.safetyNetFolderName + "/" + snapshotName
            args += [
                "--backup",
                "--backup-dir=\(safetyNetDir)"
            ]
        }

        // SSH transport
        if case let .ssh(_, port, _, _, identityFile) = task.destination {
            var sshCmd = "ssh -p \(port) -o StrictHostKeyChecking=accept-new"
            if let key = identityFile {
                sshCmd += " -i \(key)"
            }
            args += ["--rsh=\(sshCmd)"]
        }

        // Filters
        args += task.filter.rsyncArguments

        // Source (trailing slash = copy contents, not the directory itself)
        let source = task.sourcePath.hasSuffix("/") ? task.sourcePath : task.sourcePath + "/"
        args.append(source)

        // Destination
        args.append(task.destination.rsyncDestination)

        return args
    }

    /// Runs rsync and delivers output lines to the provided handler.
    /// Returns the exit code when the process finishes.
    @discardableResult
    func run(
        arguments: [String],
        outputHandler: @escaping (String) -> Void
    ) async throws -> Int32 {
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: rsyncPath)
        proc.arguments = arguments

        let pipe = Pipe()
        proc.standardOutput = pipe
        proc.standardError = pipe

        process = proc

        do {
            try proc.launch()
        } catch {
            throw NASBackupError.rsyncLaunchFailed(error)
        }

        processId = pid_t(proc.processIdentifier)
        Logger.rsync.info("Launched rsync pid=\(self.processId) args=\(arguments.joined(separator: " "))")

        // Stream output
        let handle = pipe.fileHandleForReading
        var buffer = Data()

        for try await chunk in handle.bytes {
            buffer.append(chunk)
            // Flush complete lines
            while let newline = buffer.firstIndex(of: UInt8(ascii: "\n")) {
                let lineData = buffer[buffer.startIndex...newline]
                buffer.removeSubrange(buffer.startIndex...newline)
                if let line = String(data: lineData, encoding: .utf8)?.trimmingCharacters(in: .newlines), !line.isEmpty {
                    Logger.rsync.debug("\(line)")
                    outputHandler(line)
                }
            }
        }

        proc.waitUntilExit()
        processId = 0
        process = nil

        let code = proc.terminationStatus
        Logger.rsync.info("rsync exited with code \(code)")
        return code
    }

    /// Sends SIGSTOP to pause rsync without killing it.
    func suspend() {
        guard processId > 0 else { return }
        kill(processId, SIGSTOP)
        Logger.rsync.info("Sent SIGSTOP to rsync pid=\(self.processId)")
    }

    /// Sends SIGCONT to resume a suspended rsync.
    func resume() {
        guard processId > 0 else { return }
        kill(processId, SIGCONT)
        Logger.rsync.info("Sent SIGCONT to rsync pid=\(self.processId)")
    }

    /// Terminates rsync.
    func terminate() {
        process?.terminate()
        Logger.rsync.info("Terminated rsync")
    }
}

// MARK: - Stat line parsing

extension RsyncRunner {
    static func parseStatLine(_ line: String) -> Progress? {
        // rsync --progress lines look like:
        // "      1,234,567  42%  12.34MB/s    0:00:05"
        let pattern = #"(\d[\d,]+)\s+(\d+)%\s+(\S+)"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)) else {
            return nil
        }

        func group(_ n: Int) -> String? {
            guard let range = Range(match.range(at: n), in: line) else { return nil }
            return String(line[range])
        }

        let bytesStr = group(1)?.replacingOccurrences(of: ",", with: "") ?? "0"
        let percentStr = group(2) ?? "0"
        let speed = group(3) ?? "—"

        return Progress(
            currentFile: "",
            percentComplete: Int(percentStr) ?? 0,
            speed: speed,
            bytesTotal: Int64(bytesStr) ?? 0
        )
    }
}
