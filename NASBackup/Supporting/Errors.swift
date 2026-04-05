import Foundation

enum NASBackupError: LocalizedError {
    case configurationNotFound
    case configurationDecodeFailed(Error)
    case configurationSaveFailed(Error)
    case keychainSaveFailed(OSStatus)
    case keychainReadFailed(OSStatus)
    case keychainDeleteFailed(OSStatus)
    case mountFailed(String)
    case unmountFailed(String)
    case rsyncNotFound
    case rsyncLaunchFailed(Error)
    case rsyncFailed(exitCode: Int32, output: String)
    case networkUnavailable
    case sshIdentityNotFound(String)

    var errorDescription: String? {
        switch self {
        case .configurationNotFound:
            return "Configuration file not found."
        case let .configurationDecodeFailed(e):
            return "Failed to read configuration: \(e.localizedDescription)"
        case let .configurationSaveFailed(e):
            return "Failed to save configuration: \(e.localizedDescription)"
        case let .keychainSaveFailed(status):
            return "Keychain save failed (OSStatus \(status))."
        case let .keychainReadFailed(status):
            return "Keychain read failed (OSStatus \(status))."
        case let .keychainDeleteFailed(status):
            return "Keychain delete failed (OSStatus \(status))."
        case let .mountFailed(msg):
            return "Failed to mount volume: \(msg)"
        case let .unmountFailed(msg):
            return "Failed to unmount volume: \(msg)"
        case .rsyncNotFound:
            return "rsync not found. Please install via Homebrew: brew install rsync"
        case let .rsyncLaunchFailed(e):
            return "Failed to launch rsync: \(e.localizedDescription)"
        case let .rsyncFailed(code, output):
            return "rsync exited with code \(code).\n\(output)"
        case .networkUnavailable:
            return "Network is unavailable."
        case let .sshIdentityNotFound(path):
            return "SSH identity file not found at \(path)."
        }
    }
}
