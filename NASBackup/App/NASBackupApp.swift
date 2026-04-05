import SwiftUI

@main
struct NASBackupApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var env = AppEnvironment()

    var body: some Scene {
        // The sole UI entry point is the menu bar
        MenuBarExtra {
            MenuBarView()
                .environmentObject(env)
        } label: {
            MenuBarIconView()
                .environmentObject(env)
        }
        .menuBarExtraStyle(.window)   // SwiftUI popover window, not a menu

        // Settings window — opened via "Settings…" button in the popover
        Settings {
            SettingsWindowView()
                .environmentObject(env)
                .frame(minWidth: 600, minHeight: 480)
        }
    }
}
