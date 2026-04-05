import XCTest
@testable import NASBackup

final class RsyncRunnerTests: XCTestCase {

    func testBuildArguments_SMB_withSafetyNet() throws {
        let task = BackupTask(
            name: "Test",
            sourcePath: "/Users/test",
            destination: .smb(host: "nas.local", share: "Backup",
                              mountPoint: "/Volumes/Backup",
                              username: "test", keychainLabel: "test-label"),
            filter: .default,
            retentionPolicy: RetentionPolicy(
                safetyNetEnabled: true,
                safetyNetFolderName: ".safetynet",
                keepVersionsForDays: 30,
                maxVersionsToKeep: nil,
                pruneAfterBackup: true
            ),
            networkTrigger: nil,
            schedule: .manual,
            isEnabled: true
        )

        let runner = try RsyncRunner()
        let args = runner.buildArguments(task: task, snapshotDate: Date())

        XCTAssertTrue(args.contains("--archive"))
        XCTAssertTrue(args.contains("--delete"))
        XCTAssertTrue(args.contains("--partial"))
        XCTAssertTrue(args.contains(where: { $0.hasPrefix("--backup-dir=.safetynet/") }))
        XCTAssertTrue(args.last == "/Volumes/Backup")
        XCTAssertTrue(args[args.count - 2] == "/Users/test/")
    }

    func testBuildArguments_SSH_noSafetyNet() throws {
        let task = BackupTask(
            name: "Test",
            sourcePath: "/Users/test",
            destination: .ssh(host: "nas.local", port: 22, username: "admin",
                              remotePath: "/volume1/Backups",
                              identityFilePath: "/Users/test/.ssh/id_ed25519"),
            filter: .default,
            retentionPolicy: RetentionPolicy(
                safetyNetEnabled: false,
                safetyNetFolderName: ".safetynet",
                keepVersionsForDays: 30,
                maxVersionsToKeep: nil,
                pruneAfterBackup: false
            ),
            networkTrigger: nil,
            schedule: .manual,
            isEnabled: true
        )

        let runner = try RsyncRunner()
        let args = runner.buildArguments(task: task, snapshotDate: Date())

        XCTAssertFalse(args.contains(where: { $0.hasPrefix("--backup-dir=") }))
        XCTAssertTrue(args.contains(where: { $0.hasPrefix("--rsh=ssh") }))
        XCTAssertTrue(args.last == "admin@nas.local:/volume1/Backups")
    }

    func testParseStatLine() {
        let line = "      1,234,567  42%   12.34MB/s    0:00:05"
        let progress = RsyncRunner.parseStatLine(line)
        XCTAssertNotNil(progress)
        XCTAssertEqual(progress?.percentComplete, 42)
    }

    func testFilterArguments_excludeHidden() {
        var filter = BackupFilter.default
        filter.excludeHidden = true
        filter.maxFileSizeMB = 500
        let args = filter.rsyncArguments
        XCTAssertTrue(args.contains("--exclude=.*"))
        XCTAssertTrue(args.contains("--max-size=500m"))
    }
}
