import SwiftUI

struct HistoryTabView: View {
    @EnvironmentObject var env: AppEnvironment
    @State private var selectedRunId: UUID?

    var body: some View {
        HSplitView {
            // Left: run list
            List(env.runHistory, selection: $selectedRunId) { run in
                RunListRowView(run: run).tag(run.id)
            }
            .listStyle(.bordered(alternatesRowBackgrounds: true))
            .frame(minWidth: 220, idealWidth: 240)

            // Right: detail
            if let run = env.runHistory.first(where: { $0.id == selectedRunId }) {
                RunDetailView(run: run)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView("Select a run", systemImage: "calendar",
                    description: Text("Select a backup run to see its log."))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .padding()
    }
}

// MARK: - List row

private struct RunListRowView: View {
    let run: BackupRun

    var icon: (name: String, color: Color) {
        switch run.status {
        case .completed:    return ("checkmark.circle.fill", .green)
        case .running:      return ("arrow.triangle.2.circlepath", .blue)
        case .interrupted:  return ("pause.circle.fill", .orange)
        case .failed:       return ("xmark.circle.fill", .red)
        }
    }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon.name)
                .foregroundStyle(icon.color)
                .frame(width: 16)

            VStack(alignment: .leading, spacing: 2) {
                Text(run.taskName).fontWeight(.medium).lineLimit(1)
                Text(run.startedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption).foregroundStyle(.secondary)
            }

            Spacer()

            if run.status == .completed || run.status == .running {
                Text(run.formattedBytes)
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Detail

private struct RunDetailView: View {
    let run: BackupRun

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Summary bar
            HStack(spacing: 24) {
                stat("Task", run.taskName)
                stat("Started", run.startedAt.formatted(date: .abbreviated, time: .shortened))
                stat("Duration", run.formattedDuration)
                stat("Files", "\(run.filesTransferred)")
                stat("Size", run.formattedBytes)
            }
            .padding()
            .background(Color(nsColor: .controlBackgroundColor))

            Divider()

            // Log output
            ScrollView {
                ScrollViewReader { proxy in
                    LazyVStack(alignment: .leading, spacing: 0) {
                        ForEach(run.logLines.indices, id: \.self) { i in
                            Text(run.logLines[i])
                                .font(.system(.caption, design: .monospaced))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 1)
                                .textSelection(.enabled)
                                .id(i)
                        }
                    }
                    .onAppear {
                        if !run.logLines.isEmpty {
                            proxy.scrollTo(run.logLines.count - 1)
                        }
                    }
                }
            }
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.caption.bold())
        }
    }
}
