import SwiftUI

struct NetworkTabView: View {
    @EnvironmentObject var env: AppEnvironment
    @State private var selectedTaskId: UUID?

    var body: some View {
        HStack(alignment: .top, spacing: 20) {
            // Task selector
            VStack(alignment: .leading, spacing: 4) {
                Text("Task").font(.caption.bold()).foregroundStyle(.secondary)
                List(env.configuration.tasks, selection: $selectedTaskId) { task in
                    Text(task.name).tag(task.id)
                }
                .listStyle(.bordered(alternatesRowBackgrounds: true))
                .frame(width: 160)
            }

            if let id = selectedTaskId,
               let idx = env.configuration.tasks.firstIndex(where: { $0.id == id }) {
                NetworkTriggerFormView(
                    task: env.configuration.tasks[idx],
                    trigger: $env.configuration.tasks[idx].networkTrigger
                )
                .onChange(of: env.configuration.tasks[idx].networkTrigger) { _ in env.save() }
            } else {
                ContentUnavailableView("Select a task", systemImage: "wifi")
                    .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .onAppear {
            if selectedTaskId == nil { selectedTaskId = env.configuration.tasks.first?.id }
        }
    }
}

private struct NetworkTriggerFormView: View {
    let task: BackupTask
    @Binding var trigger: NetworkTrigger?
    @EnvironmentObject var env: AppEnvironment

    @State private var ssid = ""
    @State private var delay = 10

    var body: some View {
        Form {
            Section {
                Toggle("Start backup when joining network", isOn: Binding(
                    get: { trigger != nil },
                    set: { enabled in
                        trigger = enabled ? NetworkTrigger(ssid: ssid, delaySeconds: delay) : nil
                    }
                ))
            }

            if trigger != nil {
                Section("Network") {
                    HStack {
                        TextField("SSID (network name)", text: $ssid)
                            .onChange(of: ssid) { _ in
                                trigger = NetworkTrigger(ssid: ssid, delaySeconds: delay)
                            }
                        if let currentSSID = env.networkMonitor.currentSSID {
                            Button("Use current (\(currentSSID))") {
                                ssid = currentSSID
                            }
                            .buttonStyle(.borderless)
                        }
                    }
                    .help("Exact name of your home Wi-Fi network.")

                    HStack {
                        Text("Delay after connecting")
                        Stepper("\(delay)s", value: $delay, in: 0...300, step: 5)
                            .onChange(of: delay) { _ in
                                trigger = NetworkTrigger(ssid: ssid, delaySeconds: delay)
                            }
                    }
                    .help("Wait this many seconds after connecting before starting the backup, to let the NAS wake up.")
                }

                Section("Status") {
                    HStack {
                        Image(systemName: env.networkMonitor.isWiFiConnected ? "wifi" : "wifi.slash")
                            .foregroundStyle(env.networkMonitor.isWiFiConnected ? .green : .secondary)
                        if let current = env.networkMonitor.currentSSID {
                            Text("Connected to \"\(current)\"")
                                .foregroundStyle(current == ssid ? .green : .secondary)
                            if current == ssid {
                                Text("(matches trigger)")
                                    .font(.caption)
                                    .foregroundStyle(.green)
                            }
                        } else {
                            Text("Not connected to Wi-Fi")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .formStyle(.grouped)
        .onAppear {
            if let t = trigger {
                ssid = t.ssid
                delay = t.delaySeconds
            }
        }
    }
}
