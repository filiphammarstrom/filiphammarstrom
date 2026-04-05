import Foundation

struct NetworkTrigger: Codable, Equatable {
    var ssid: String           // Exact SSID match, e.g. "HomeNetwork_5GHz"
    var delaySeconds: Int      // Wait after connecting before starting backup
}
