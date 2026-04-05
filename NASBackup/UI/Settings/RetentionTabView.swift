import SwiftUI

struct RetentionTabView: View {
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

            // Retention form
            if let id = selectedTaskId,
               let idx = env.configuration.tasks.firstIndex(where: { $0.id == id }) {
                RetentionFormView(policy: $env.configuration.tasks[idx].retentionPolicy)
                    .onChange(of: env.configuration.tasks[idx].retentionPolicy) { _ in env.save() }
            } else {
                ContentUnavailableView("Select a task", systemImage: "clock.arrow.circlepath")
                    .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .onAppear {
            if selectedTaskId == nil { selectedTaskId = env.configuration.tasks.first?.id }
        }
    }
}

private struct RetentionFormView: View {
    @Binding var policy: RetentionPolicy

    var body: some View {
        Form {
            Section("SafetyNet") {
                Toggle("Enable file versioning (SafetyNet)", isOn: $policy.safetyNetEnabled)
                    .help("Before overwriting or deleting a file, the old version is moved to a dated snapshot folder.")

                if policy.safetyNetEnabled {
                    TextField("Snapshot folder name", text: $policy.safetyNetFolderName)
                        .help("Relative to the destination root. Default: .safetynet")

                    Toggle("Prune old snapshots after each backup", isOn: $policy.pruneAfterBackup)
                }
            }

            if policy.safetyNetEnabled {
                Section("Retention window") {
                    HStack {
                        Text("Keep snapshots for")
                        Stepper("\(policy.keepVersionsForDays) days",
                                value: $policy.keepVersionsForDays,
                                in: 1...3650, step: 1)
                    }

                    Toggle("Limit number of snapshots", isOn: Binding(
                        get: { policy.maxVersionsToKeep != nil },
                        set: { policy.maxVersionsToKeep = $0 ? 10 : nil }
                    ))

                    if let max = policy.maxVersionsToKeep {
                        HStack {
                            Text("Keep at most")
                            Stepper("\(max) snapshots",
                                    value: Binding(
                                        get: { max },
                                        set: { policy.maxVersionsToKeep = $0 }
                                    ),
                                    in: 1...9999, step: 1)
                        }
                    }
                }
            }
        }
        .formStyle(.grouped)
    }
}
