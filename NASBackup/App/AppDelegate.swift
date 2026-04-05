import AppKit
import OSLog
import ServiceManagement

final class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Suppress Dock icon — we're a menu bar only app
        NSApp.setActivationPolicy(.accessory)

        Logger.app.info("NASBackup launched")

        requestNotificationPermission()
    }

    func applicationWillTerminate(_ notification: Notification) {
        Logger.app.info("NASBackup terminating")
    }

    // MARK: - Login item

    func setLaunchAtLogin(_ enabled: Bool) {
        if #available(macOS 13.0, *) {
            do {
                if enabled {
                    try SMAppService.mainApp.register()
                } else {
                    try SMAppService.mainApp.unregister()
                }
            } catch {
                Logger.app.error("Failed to set launch at login: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Notifications

    private func requestNotificationPermission() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound]) { granted, error in
            if let error {
                Logger.app.error("Notification permission error: \(error.localizedDescription)")
            } else {
                Logger.app.info("Notification permission granted: \(granted)")
            }
        }
    }
}

// Make UNUserNotificationCenter available without import in AppDelegate
import UserNotifications
