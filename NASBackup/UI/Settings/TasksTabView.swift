import SwiftUI

struct TasksTabView: View {
    @EnvironmentObject var env: AppEnvironment
    @State private var selectedTaskId: UUID?
    @State private var showingEditor = false
    @State private var editingTask: BackupTask?

    var body: some View {
        HSplitView {
            // Left: task list
            VStack(spacing: 0) {
                List(env.configuration.tasks, selection: $selectedTaskId) { task in
                    TaskListRowView(task: task)
                        .tag(task.id)
                        .contextMenu {
                            Button("Edit…") { edit(task) }
                            Button("Back Up Now") { env.startBackup(task: task) }
                                .disabled(env.engine.isRunning)
                            Divider()
                            Button("Delete", role: .destructive) { env.deleteTask(id: task.id) }
                        }
                }
                .listStyle(.bordered(alternatesRowBackgrounds: true))

                Divider()

                HStack {
                    Button { addTask() } label: { Image(systemName: "plus") }
                    Button {
                        if let id = selectedTaskId { env.deleteTask(id: id) }
                    } label: {
                        Image(systemName: "minus")
                    }
                    .disabled(selectedTaskId == nil)
                    Spacer()
                    if let id = selectedTaskId, let task = task(for: id) {
                        Button("Edit…") { edit(task) }
                            .buttonStyle(.borderless)
                    }
                }
                .padding(8)
            }
            .frame(minWidth: 180, idealWidth: 200)

            // Right: detail / empty state
            if let id = selectedTaskId, let task = task(for: id) {
                TaskDetailView(task: task, onEdit: { edit(task) }, onRun: { env.startBackup(task: task) })
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .environmentObject(env)
            } else {
                ContentUnavailableView("Select a Task", systemImage: "externaldrive.badge.wifi",
                    description: Text("Select a backup task from the list or add a new one."))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .sheet(isPresented: $showingEditor) {
            if let task = editingTask {
                TaskEditorView(task: task) { updated in
                    env.updateTask(updated)
                    showingEditor = false
                } onCancel: {
                    showingEditor = false
                }
                .environmentObject(env)
                .frame(minWidth: 500, minHeight: 400)
            }
        }
    }

    private func task(for id: UUID) -> BackupTask? {
        env.configuration.tasks.first { $0.id == id }
    }

    private func addTask() {
        let t = BackupTask.makeDefault()
        env.addTask(t)
        selectedTaskId = t.id
        editingTask = t
        showingEditor = true
    }

    private func edit(_ task: BackupTask) {
        editingTask = task
        showingEditor = true
    }
}

// MARK: - List row

private struct TaskListRowView: View {
    let task: BackupTask

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: task.isEnabled ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(task.isEnabled ? .green : .secondary)
            VStack(alignment: .leading, spacing: 1) {
                Text(task.name).fontWeight(.medium)
                Text(task.destination.displayName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Detail view

private struct TaskDetailView: View {
    let task: BackupTask
    let onEdit: () -> Void
    let onRun: () -> Void
    @EnvironmentObject var env: AppEnvironment

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(task.name).font(.title2.bold())
                    Spacer()
                    Button("Edit…", action: onEdit)
                    Button("Back Up Now", action: onRun)
                        .buttonStyle(.borderedProminent)
                        .disabled(env.engine.isRunning)
                }

                GroupBox("Source") {
                    LabeledRow("Path", task.sourcePath)
                }

                GroupBox("Destination") {
                    LabeledRow("Connection", task.destination.displayName)
                    LabeledRow("Type", task.destination.isSSH ? "SSH / rsync" : "SMB")
                }

                GroupBox("Schedule") {
                    LabeledRow("Trigger", task.schedule.displayName)
                    if let trigger = task.networkTrigger {
                        LabeledRow("Network SSID", trigger.ssid)
                        LabeledRow("Delay", "\(trigger.delaySeconds)s after connect")
                    }
                }

                GroupBox("Retention") {
                    LabeledRow("SafetyNet", task.retentionPolicy.safetyNetEnabled ? "Enabled" : "Disabled")
                    if task.retentionPolicy.safetyNetEnabled {
                        LabeledRow("Keep for", "\(task.retentionPolicy.keepVersionsForDays) days")
                        if let max = task.retentionPolicy.maxVersionsToKeep {
                            LabeledRow("Max versions", "\(max)")
                        }
                    }
                }
            }
            .padding()
        }
    }
}

private struct LabeledRow: View {
    let label: String
    let value: String
    init(_ label: String, _ value: String) {
        self.label = label
        self.value = value
    }
    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .foregroundStyle(.secondary)
                .frame(width: 110, alignment: .trailing)
            Text(value)
            Spacer()
        }
        .padding(.vertical, 2)
    }
}
