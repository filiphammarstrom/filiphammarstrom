import SwiftUI

struct FiltersEditorView: View {
    @Binding var filter: BackupFilter
    @State private var newExclude = ""
    @State private var newInclude = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Toggle("Exclude hidden files (.*)", isOn: $filter.excludeHidden)

            maxFileSizeRow

            Group {
                patternList(
                    title: "Exclude patterns",
                    systemImage: "minus.circle",
                    patterns: $filter.excludePatterns,
                    newPattern: $newExclude
                )

                patternList(
                    title: "Include patterns (override excludes)",
                    systemImage: "plus.circle",
                    patterns: $filter.includePatterns,
                    newPattern: $newInclude
                )
            }

            Button("Reset to defaults") {
                filter = .default
            }
            .foregroundStyle(.red)
        }
    }

    private var maxFileSizeRow: some View {
        HStack {
            Toggle("Skip files larger than", isOn: Binding(
                get: { filter.maxFileSizeMB != nil },
                set: { filter.maxFileSizeMB = $0 ? 500 : nil }
            ))
            if let mb = filter.maxFileSizeMB {
                Stepper("\(mb) MB", value: Binding(
                    get: { mb },
                    set: { filter.maxFileSizeMB = $0 }
                ), in: 1...100_000, step: 100)
                .frame(width: 140)
            }
        }
    }

    private func patternList(
        title: String,
        systemImage: String,
        patterns: Binding<[String]>,
        newPattern: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(title, systemImage: systemImage)
                .font(.caption.bold())
                .foregroundStyle(.secondary)

            ForEach(patterns.wrappedValue.indices, id: \.self) { i in
                HStack {
                    Text(patterns.wrappedValue[i])
                        .font(.system(.caption, design: .monospaced))
                        .foregroundStyle(.primary)
                    Spacer()
                    Button {
                        patterns.wrappedValue.remove(at: i)
                    } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }

            HStack {
                TextField("Add pattern, e.g. *.log", text: newPattern)
                    .font(.system(.caption, design: .monospaced))
                    .onSubmit { addPattern(newPattern, to: patterns) }
                Button("Add") { addPattern(newPattern, to: patterns) }
                    .buttonStyle(.borderless)
                    .disabled(newPattern.wrappedValue.isEmpty)
            }
        }
    }

    private func addPattern(_ newPattern: Binding<String>, to patterns: Binding<[String]>) {
        let p = newPattern.wrappedValue.trimmingCharacters(in: .whitespaces)
        guard !p.isEmpty, !patterns.wrappedValue.contains(p) else { return }
        patterns.wrappedValue.append(p)
        newPattern.wrappedValue = ""
    }
}
