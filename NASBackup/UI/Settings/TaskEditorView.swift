import SwiftUI

struct TaskEditorView: View {
    @State private var task: BackupTask
    let onSave: (BackupTask) -> Void
    let onCancel: () -> Void

    @State private var destinationType: DestType = .smb
    // SMB fields
    @State private var smbHost = ""
    @State private var smbShare = ""
    @State private var smbMountPoint = ""
    @State private var smbUser = ""
    @State private var smbPassword = ""
    // SSH fields
    @State private var sshHost = ""
    @State private var sshPort = "22"
    @State private var sshUser = ""
    @State private var sshRemotePath = ""
    @State private var sshIdentityFile = ""

    enum DestType: String, CaseIterable, Identifiable {
        case smb = "SMB (Mounted Volume)"
        case ssh = "SSH / rsync"
        var id: String { rawValue }
    }

    init(task: BackupTask, onSave: @escaping (BackupTask) -> Void, onCancel: @escaping () -> Void) {
        _task = State(initialValue: task)
        self.onSave = onSave
        self.onCancel = onCancel
    }

    var body: some View {
        VStack(spacing: 0) {
            Form {
                Section("General") {
                    TextField("Task name", text: $task.name)
                    Toggle("Enabled", isOn: $task.isEnabled)
                }

                Section("Source") {
                    HStack {
                        TextField("Source folder", text: $task.sourcePath)
                        Button("Choose…") { pickSourceFolder() }
                    }
                }

                Section("Destination") {
                    Picker("Connection type", selection: $destinationType) {
                        ForEach(DestType.allCases) { t in Text(t.rawValue).tag(t) }
                    }
                    .pickerStyle(.segmented)

                    if destinationType == .smb {
                        TextField("NAS hostname or IP", text: $smbHost)
                        TextField("Share name", text: $smbShare)
                        TextField("Mount point path", text: $smbMountPoint)
                            .help("e.g. /Volumes/NASBackup")
                        TextField("Username", text: $smbUser)
                        SecureField("Password (stored in Keychain)", text: $smbPassword)
                    } else {
                        TextField("NAS hostname or IP", text: $sshHost)
                        TextField("SSH port", text: $sshPort)
                        TextField("Username", text: $sshUser)
                        TextField("Remote path", text: $sshRemotePath)
                            .help("e.g. /volume1/Backups/MyMac")
                        TextField("SSH identity file (optional)", text: $sshIdentityFile)
                            .help("Path to private key, e.g. ~/.ssh/id_ed25519")
                    }
                }

                Section("Schedule") {
                    SchedulePickerView(schedule: $task.schedule)
                }

                Section("Filters") {
                    FiltersEditorView(filter: $task.filter)
                }
            }
            .formStyle(.grouped)

            Divider()

            HStack {
                Spacer()
                Button("Cancel", action: onCancel)
                    .keyboardShortcut(.cancelAction)
                Button("Save") { save() }
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .onAppear { populateFromTask() }
    }

    // MARK: - Helpers

    private func pickSourceFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose Source"
        if panel.runModal() == .OK {
            task.sourcePath = panel.url?.path ?? task.sourcePath
        }
    }

    private func populateFromTask() {
        switch task.destination {
        case let .smb(host, share, mountPoint, user, _):
            destinationType = .smb
            smbHost = host; smbShare = share
            smbMountPoint = mountPoint; smbUser = user
        case let .ssh(host, port, user, remotePath, identityFile):
            destinationType = .ssh
            sshHost = host; sshPort = "\(port)"
            sshUser = user; sshRemotePath = remotePath
            sshIdentityFile = identityFile ?? ""
        }
    }

    private func save() {
        let label = "NASBackup-SMB-\(smbHost)"

        switch destinationType {
        case .smb:
            if !smbPassword.isEmpty {
                try? KeychainHelper.save(password: smbPassword, label: label)
            }
            task.destination = .smb(
                host: smbHost, share: smbShare,
                mountPoint: smbMountPoint, username: smbUser,
                keychainLabel: label
            )
        case .ssh:
            task.destination = .ssh(
                host: sshHost,
                port: Int(sshPort) ?? 22,
                username: sshUser,
                remotePath: sshRemotePath,
                identityFilePath: sshIdentityFile.isEmpty ? nil : sshIdentityFile
            )
        }

        onSave(task)
    }
}

// MARK: - Schedule picker

private struct SchedulePickerView: View {
    @Binding var schedule: BackupSchedule

    enum ScheduleType: String, CaseIterable, Identifiable {
        case manual = "Manual"
        case interval = "Interval"
        case daily = "Daily"
        var id: String { rawValue }
    }

    @State private var type: ScheduleType = .manual
    @State private var intervalHours: Double = 1
    @State private var dailyHour: Int = 2
    @State private var dailyMinute: Int = 0

    var body: some View {
        Picker("Trigger", selection: $type) {
            ForEach(ScheduleType.allCases) { t in Text(t.rawValue).tag(t) }
        }
        .pickerStyle(.menu)
        .onChange(of: type) { _ in updateSchedule() }

        if type == .interval {
            HStack {
                Slider(value: $intervalHours, in: 0.5...24, step: 0.5)
                    .onChange(of: intervalHours) { _ in updateSchedule() }
                Text(intervalHours >= 1 ? "\(Int(intervalHours))h" : "30m")
                    .frame(width: 36)
            }
        }

        if type == .daily {
            HStack {
                Picker("Hour", selection: $dailyHour) {
                    ForEach(0..<24, id: \.self) { Text(String(format: "%02d", $0)).tag($0) }
                }
                .pickerStyle(.menu)
                .frame(width: 70)
                Text(":")
                Picker("Minute", selection: $dailyMinute) {
                    ForEach([0, 15, 30, 45], id: \.self) { Text(String(format: "%02d", $0)).tag($0) }
                }
                .pickerStyle(.menu)
                .frame(width: 70)
            }
            .onChange(of: dailyHour)   { _ in updateSchedule() }
            .onChange(of: dailyMinute) { _ in updateSchedule() }
        }
    }

    private func updateSchedule() {
        switch type {
        case .manual:   schedule = .manual
        case .interval: schedule = .interval(seconds: intervalHours * 3600)
        case .daily:    schedule = .daily(hour: dailyHour, minute: dailyMinute)
        }
    }
}
