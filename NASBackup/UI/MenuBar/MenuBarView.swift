import SwiftUI

struct MenuBarView: View {
    @EnvironmentObject var env: AppEnvironment
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            headerSection
            Divider()
            tasksSection
            Divider()
            footerSection
        }
        .frame(width: 280)
        .padding(.vertical, 6)
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("NASBackup")
                    .font(.headline)
                statusLine
            }
            Spacer()
            networkIndicator
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    @ViewBuilder
    private var statusLine: some View {
        if env.engine.isRunning, let run = env.engine.activeRun {
            HStack(spacing: 4) {
                ProgressView().scaleEffect(0.6).frame(width: 14, height: 14)
                Text(env.engine.currentFile.isEmpty ? "Backing up…" : env.engine.currentFile)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
        } else if let last = env.runHistory.first {
            Text("Last: \(last.startedAt.formatted(.relative(presentation: .named)))")
                .font(.caption)
                .foregroundStyle(.secondary)
        } else {
            Text("No backups yet")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var networkIndicator: some View {
        HStack(spacing: 4) {
            Image(systemName: env.networkMonitor.isWiFiConnected ? "wifi" : "wifi.slash")
                .imageScale(.small)
                .foregroundStyle(env.networkMonitor.isWiFiConnected ? Color.green : Color.secondary)
            if let ssid = env.networkMonitor.currentSSID {
                Text(ssid)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }

    // MARK: - Tasks

    private var tasksSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            ForEach(env.configuration.tasks) { task in
                TaskRowView(task: task)
                    .environmentObject(env)
            }

            if env.configuration.tasks.isEmpty {
                Text("No tasks configured.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
            }
        }
    }

    // MARK: - Footer

    private var footerSection: some View {
        HStack {
            Button("Settings…") { openSettings() }
                .buttonStyle(.plain)
                .font(.caption)

            Spacer()

            Button("Quit") { NSApplication.shared.terminate(nil) }
                .buttonStyle(.plain)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
    }
}

// MARK: - Task row

private struct TaskRowView: View {
    let task: BackupTask
    @EnvironmentObject var env: AppEnvironment

    private var isActive: Bool {
        env.engine.activeRun?.taskId == task.id && env.engine.isRunning
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 1) {
                Text(task.name)
                    .font(.callout)
                    .lineLimit(1)
                Text(task.sourcePath)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }

            Spacer()

            if isActive {
                Button("Pause") { env.cancelBackup() }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
            } else {
                Button("Back Up Now") { env.startBackup(task: task) }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .disabled(env.engine.isRunning)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 6)
        .contentShape(Rectangle())
    }
}

// MARK: - MenuBar icon

struct MenuBarIconView: View {
    @EnvironmentObject var env: AppEnvironment

    var body: some View {
        if env.engine.isRunning {
            Image(systemName: "arrow.triangle.2.circlepath")
                .symbolEffect(.rotate, isActive: true)
        } else {
            Image(systemName: "externaldrive.badge.wifi")
        }
    }
}
