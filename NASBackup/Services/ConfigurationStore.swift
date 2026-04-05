import Foundation
import OSLog

final class ConfigurationStore {
    private let configURL: URL
    private let resumeStateURL: URL

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    init() {
        let support = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("NASBackup", isDirectory: true)

        try? FileManager.default.createDirectory(at: support, withIntermediateDirectories: true)

        configURL     = support.appendingPathComponent("config.json")
        resumeStateURL = support.appendingPathComponent("resume_state.json")
    }

    func load() -> AppConfiguration {
        guard let data = try? Data(contentsOf: configURL) else {
            return .default
        }
        do {
            return try decoder.decode(AppConfiguration.self, from: data)
        } catch {
            Logger.app.error("Failed to decode config: \(error.localizedDescription)")
            return .default
        }
    }

    func save(_ config: AppConfiguration) throws {
        let data = try encoder.encode(config)
        try data.write(to: configURL, options: .atomic)
    }

    func loadResumeState() -> ResumeState? {
        guard let data = try? Data(contentsOf: resumeStateURL) else { return nil }
        return try? decoder.decode(ResumeState.self, from: data)
    }

    func saveResumeState(_ state: ResumeState?) {
        if let state {
            if let data = try? encoder.encode(state) {
                try? data.write(to: resumeStateURL, options: .atomic)
            }
        } else {
            try? FileManager.default.removeItem(at: resumeStateURL)
        }
    }
}
