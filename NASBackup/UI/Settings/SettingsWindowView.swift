import SwiftUI

struct SettingsWindowView: View {
    @EnvironmentObject var env: AppEnvironment

    var body: some View {
        TabView {
            TasksTabView()
                .tabItem { Label("Tasks", systemImage: "list.bullet") }
                .environmentObject(env)

            NetworkTabView()
                .tabItem { Label("Network", systemImage: "wifi") }
                .environmentObject(env)

            RetentionTabView()
                .tabItem { Label("Retention", systemImage: "clock.arrow.circlepath") }
                .environmentObject(env)

            HistoryTabView()
                .tabItem { Label("History", systemImage: "calendar") }
                .environmentObject(env)

            GeneralTabView()
                .tabItem { Label("General", systemImage: "gear") }
                .environmentObject(env)
        }
        .padding(20)
    }
}
