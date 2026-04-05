import XCTest
@testable import NASBackup

final class RetentionManagerTests: XCTestCase {

    private let formatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd_HHmmss"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    func testPrunesSnapshotsOlderThanWindow() throws {
        let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("NASBackupTestSafetyNet-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: tmpDir) }

        // Create fake snapshot directories
        let now = Date()
        let names: [Date] = [
            now.addingTimeInterval(-1 * 86400),    // 1 day ago — keep
            now.addingTimeInterval(-5 * 86400),    // 5 days ago — keep
            now.addingTimeInterval(-40 * 86400),   // 40 days ago — prune (> 30 days)
            now.addingTimeInterval(-100 * 86400),  // 100 days ago — prune
        ]
        for date in names {
            let name = formatter.string(from: date)
            let dir = tmpDir.appendingPathComponent(name)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }

        let task = BackupTask(
            name: "Test",
            sourcePath: "/Users/test",
            destination: .smb(host: "nas", share: "Backup",
                               mountPoint: tmpDir.deletingLastPathComponent().path,
                               username: "u", keychainLabel: "k"),
            filter: .default,
            retentionPolicy: RetentionPolicy(
                safetyNetEnabled: true,
                safetyNetFolderName: tmpDir.lastPathComponent,
                keepVersionsForDays: 30,
                maxVersionsToKeep: nil,
                pruneAfterBackup: true
            ),
            networkTrigger: nil,
            schedule: .manual,
            isEnabled: true
        )

        let manager = RetentionManager()
        try await manager.prune(task: task)

        let remaining = try FileManager.default.contentsOfDirectory(atPath: tmpDir.path)
        XCTAssertEqual(remaining.count, 2, "Should keep 2 snapshots within 30-day window")
    }

    func testMaxVersionsCap() throws {
        let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("NASBackupTestMaxVersions-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: tmpDir) }

        let now = Date()
        for i in 0..<5 {
            let date = now.addingTimeInterval(-Double(i) * 86400)
            let name = formatter.string(from: date)
            try FileManager.default.createDirectory(
                at: tmpDir.appendingPathComponent(name),
                withIntermediateDirectories: true
            )
        }

        let task = BackupTask(
            name: "Test",
            sourcePath: "/Users/test",
            destination: .smb(host: "nas", share: "Backup",
                               mountPoint: tmpDir.deletingLastPathComponent().path,
                               username: "u", keychainLabel: "k"),
            filter: .default,
            retentionPolicy: RetentionPolicy(
                safetyNetEnabled: true,
                safetyNetFolderName: tmpDir.lastPathComponent,
                keepVersionsForDays: 30,
                maxVersionsToKeep: 2,  // hard cap
                pruneAfterBackup: true
            ),
            networkTrigger: nil,
            schedule: .manual,
            isEnabled: true
        )

        let manager = RetentionManager()
        try await manager.prune(task: task)

        let remaining = try FileManager.default.contentsOfDirectory(atPath: tmpDir.path)
        XCTAssertEqual(remaining.count, 2, "Should keep at most 2 snapshots")
    }
}
