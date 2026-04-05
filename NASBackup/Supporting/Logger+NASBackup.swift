import OSLog

extension Logger {
    private static let subsystem = "com.filiphammarstrom.NASBackup"

    static let app        = Logger(subsystem: subsystem, category: "App")
    static let backup     = Logger(subsystem: subsystem, category: "Backup")
    static let rsync      = Logger(subsystem: subsystem, category: "Rsync")
    static let network    = Logger(subsystem: subsystem, category: "Network")
    static let mount      = Logger(subsystem: subsystem, category: "Mount")
    static let retention  = Logger(subsystem: subsystem, category: "Retention")
    static let schedule   = Logger(subsystem: subsystem, category: "Schedule")
}
