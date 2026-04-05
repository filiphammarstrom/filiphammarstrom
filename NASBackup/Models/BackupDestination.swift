import Foundation

enum BackupDestination: Codable, Equatable {
    case smb(host: String, share: String, mountPoint: String, username: String, keychainLabel: String)
    case ssh(host: String, port: Int, username: String, remotePath: String, identityFilePath: String?)

    var displayName: String {
        switch self {
        case let .smb(host, share, _, _, _):
            return "smb://\(host)/\(share)"
        case let .ssh(host, port, user, path, _):
            return "\(user)@\(host):\(port)\(path)"
        }
    }

    var isSSH: Bool {
        if case .ssh = self { return true }
        return false
    }

    var isSMB: Bool {
        if case .smb = self { return true }
        return false
    }

    // Resolved local path where files will be written by rsync.
    // For SMB: the mount point path.
    // For SSH: the remote path (used as rsync destination string directly).
    var rsyncDestination: String {
        switch self {
        case let .smb(_, _, mountPoint, _, _):
            return mountPoint
        case let .ssh(host, _, user, remotePath, _):
            return "\(user)@\(host):\(remotePath)"
        }
    }
}
