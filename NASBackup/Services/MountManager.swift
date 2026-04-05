import Foundation
import OSLog

/// Mounts and unmounts SMB volumes programmatically.
final class MountManager {

    /// Mounts an SMB share. Returns the actual mount point path.
    func mount(host: String, share: String, mountPoint: String, username: String, keychainLabel: String) async throws -> String {
        // Check if already mounted
        if FileManager.default.fileExists(atPath: mountPoint) {
            Logger.mount.info("Volume already mounted at \(mountPoint)")
            return mountPoint
        }

        let password = try KeychainHelper.retrieve(label: keychainLabel)

        // Build the SMB URL: smb://user:password@host/share
        // We use /sbin/mount_smbfs to avoid Finder involvement
        let encodedPassword = password.addingPercentEncoding(withAllowedCharacters: .urlPasswordAllowed) ?? password
        let smbURL = "//\(username):\(encodedPassword)@\(host)/\(share)"

        try FileManager.default.createDirectory(atPath: mountPoint, withIntermediateDirectories: true)

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/sbin/mount_smbfs")
        proc.arguments = [smbURL, mountPoint]

        // Redirect stderr so the password isn't printed to logs
        proc.standardError = Pipe()

        do {
            try proc.launch()
        } catch {
            throw NASBackupError.mountFailed("Failed to launch mount_smbfs: \(error.localizedDescription)")
        }

        proc.waitUntilExit()

        guard proc.terminationStatus == 0 else {
            throw NASBackupError.mountFailed("mount_smbfs exited with code \(proc.terminationStatus)")
        }

        Logger.mount.info("Mounted SMB share at \(mountPoint)")
        return mountPoint
    }

    /// Unmounts a volume by mount point path.
    func unmount(mountPoint: String) async throws {
        guard FileManager.default.fileExists(atPath: mountPoint) else { return }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/sbin/umount")
        proc.arguments = [mountPoint]
        proc.standardError = Pipe()

        do {
            try proc.launch()
        } catch {
            throw NASBackupError.unmountFailed("Failed to launch umount: \(error.localizedDescription)")
        }

        proc.waitUntilExit()

        guard proc.terminationStatus == 0 else {
            throw NASBackupError.unmountFailed("umount exited with code \(proc.terminationStatus)")
        }

        Logger.mount.info("Unmounted \(mountPoint)")
    }
}
