import Foundation

struct AppConfiguration: Codable {
    var tasks: [BackupTask]
    var launchAtLogin: Bool
    var showInMenuBar: Bool
    var notificationsEnabled: Bool

    static let `default` = AppConfiguration(
        tasks: [],
        launchAtLogin: true,
        showInMenuBar: true,
        notificationsEnabled: true
    )
}
