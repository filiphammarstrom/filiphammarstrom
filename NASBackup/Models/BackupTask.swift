import Foundation

struct BackupTask: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var name: String
    var sourcePath: String
    var destination: BackupDestination
    var filter: BackupFilter
    var retentionPolicy: RetentionPolicy
    var networkTrigger: NetworkTrigger?    // nil = no automatic network trigger
    var schedule: BackupSchedule
    var isEnabled: Bool
    var createdAt: Date = Date()

    static func makeDefault(name: String = "New Backup") -> BackupTask {
        BackupTask(
            name: name,
            sourcePath: NSHomeDirectory(),
            destination: .smb(
                host: "nas.local",
                share: "Backups",
                mountPoint: "/Volumes/Backups",
                username: NSUserName(),
                keychainLabel: "NASBackup-SMB-nas.local"
            ),
            filter: .default,
            retentionPolicy: .default,
            networkTrigger: nil,
            schedule: .manual,
            isEnabled: true
        )
    }
}
