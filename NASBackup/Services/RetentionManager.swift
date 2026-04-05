import Foundation
import OSLog

/// Prunes old SafetyNet snapshot directories at the destination according to a RetentionPolicy.
final class RetentionManager {

    private let snapshotDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd_HHmmss"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    /// Prune old snapshots for an SMB destination (local filesystem path).
    func prune(task: BackupTask) async throws {
        let policy = task.retentionPolicy
        guard policy.safetyNetEnabled else { return }

        switch task.destination {
        case let .smb(_, _, mountPoint, _, _):
            let safetyNetURL = URL(fileURLWithPath: mountPoint)
                .appendingPathComponent(policy.safetyNetFolderName)
            try await pruneLocalDirectory(safetyNetURL, policy: policy)

        case let .ssh(host, port, user, remotePath, identityFile):
            let remoteDir = remotePath + "/" + policy.safetyNetFolderName
            try await pruneSSHDirectory(
                host: host, port: port, user: user,
                remoteDir: remoteDir,
                identityFile: identityFile,
                policy: policy
            )
        }
    }

    // MARK: - Local (SMB)

    private func pruneLocalDirectory(_ dir: URL, policy: RetentionPolicy) async throws {
        let fm = FileManager.default
        guard fm.fileExists(atPath: dir.path) else { return }

        let contents = try fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.isDirectoryKey])
        let snapshots = contents
            .filter { url in
                (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true
            }
            .compactMap { url -> (url: URL, date: Date)? in
                guard let date = snapshotDateFormatter.date(from: url.lastPathComponent) else { return nil }
                return (url, date)
            }
            .sorted { $0.date > $1.date }    // newest first

        let toDelete = snapshotsToDelete(snapshots.map(\.date), policy: policy)

        for (url, date) in snapshots where toDelete.contains(date) {
            Logger.retention.info("Pruning snapshot: \(url.lastPathComponent)")
            try fm.removeItem(at: url)
        }
    }

    // MARK: - SSH

    private func pruneSSHDirectory(
        host: String, port: Int, user: String,
        remoteDir: String,
        identityFile: String?,
        policy: RetentionPolicy
    ) async throws {
        // List remote snapshot directories
        var sshArgs = ["-p", "\(port)", "-o", "StrictHostKeyChecking=accept-new"]
        if let key = identityFile { sshArgs += ["-i", key] }

        let listOutput = try await runSSH(
            host: host, user: user, sshArgs: sshArgs,
            command: "ls -1 \(remoteDir) 2>/dev/null || true"
        )

        let snapshots = listOutput
            .split(separator: "\n")
            .map(String.init)
            .compactMap { name -> (name: String, date: Date)? in
                guard let date = snapshotDateFormatter.date(from: name) else { return nil }
                return (name, date)
            }
            .sorted { $0.date > $1.date }

        let toDelete = snapshotsToDelete(snapshots.map(\.date), policy: policy)

        for (name, date) in snapshots where toDelete.contains(date) {
            Logger.retention.info("Pruning remote snapshot: \(name)")
            try await runSSH(
                host: host, user: user, sshArgs: sshArgs,
                command: "rm -rf \(remoteDir)/\(name)"
            )
        }
    }

    @discardableResult
    private func runSSH(host: String, user: String, sshArgs: [String], command: String) async throws -> String {
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/ssh")
        proc.arguments = sshArgs + ["\(user)@\(host)", command]

        let pipe = Pipe()
        proc.standardOutput = pipe
        proc.standardError = Pipe()

        try proc.launch()
        proc.waitUntilExit()

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(data: data, encoding: .utf8) ?? ""
    }

    // MARK: - Logic

    private func snapshotsToDelete(_ dates: [Date], policy: RetentionPolicy) -> Set<Date> {
        let cutoff = Date().addingTimeInterval(-Double(policy.keepVersionsForDays) * 86400)
        var remaining = dates.filter { $0 >= cutoff }    // keep within window

        // Apply hard cap
        if let maxKeep = policy.maxVersionsToKeep, remaining.count > maxKeep {
            remaining = Array(remaining.prefix(maxKeep))
        }

        let keepSet = Set(remaining)
        return Set(dates).subtracting(keepSet)
    }
}
