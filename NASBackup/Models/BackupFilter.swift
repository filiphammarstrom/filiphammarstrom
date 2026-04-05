import Foundation

struct BackupFilter: Codable, Equatable {
    var excludePatterns: [String]
    var includePatterns: [String]
    var excludeHidden: Bool
    var maxFileSizeMB: Int?

    static let `default` = BackupFilter(
        excludePatterns: [
            ".DS_Store",
            ".Spotlight-V100",
            ".Trashes",
            ".fseventsd",
            ".DocumentRevisions-V100",
            "*.tmp",
            "*.temp",
            "Library/Caches/**",
            "Library/Logs/**",
            ".Trash/**",
            "node_modules/**",
            ".git/**"
        ],
        includePatterns: [],
        excludeHidden: false,
        maxFileSizeMB: nil
    )

    // Returns rsync --exclude/--include/--max-size arguments derived from this filter.
    var rsyncArguments: [String] {
        var args: [String] = []

        for pattern in includePatterns {
            args += ["--include=\(pattern)"]
        }

        if excludeHidden {
            args += ["--exclude=.*"]
        }

        for pattern in excludePatterns {
            args += ["--exclude=\(pattern)"]
        }

        if let maxMB = maxFileSizeMB {
            args += ["--max-size=\(maxMB)m"]
        }

        return args
    }
}
