import Foundation

struct RetentionPolicy: Codable, Equatable {
    var safetyNetEnabled: Bool
    var safetyNetFolderName: String    // relative to dest root, e.g. ".safetynet"
    var keepVersionsForDays: Int       // prune snapshots older than this
    var maxVersionsToKeep: Int?        // hard cap; nil = unlimited within the days window
    var pruneAfterBackup: Bool         // run pruning automatically after each successful run

    static let `default` = RetentionPolicy(
        safetyNetEnabled: true,
        safetyNetFolderName: ".safetynet",
        keepVersionsForDays: 30,
        maxVersionsToKeep: nil,
        pruneAfterBackup: true
    )
}
