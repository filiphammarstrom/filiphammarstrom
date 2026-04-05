import SwiftUI

struct GeneralTabView: View {
    @EnvironmentObject var env: AppEnvironment
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some View {
        Form {
            Section("Startup") {
                Toggle("Launch at login", isOn: $env.configuration.launchAtLogin)
                    .onChange(of: env.configuration.launchAtLogin) { enabled in
                        appDelegate.setLaunchAtLogin(enabled)
                        env.save()
                    }
            }

            Section("Notifications") {
                Toggle("Show notifications for completed backups", isOn: $env.configuration.notificationsEnabled)
                    .onChange(of: env.configuration.notificationsEnabled) { _ in env.save() }
            }

            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}
