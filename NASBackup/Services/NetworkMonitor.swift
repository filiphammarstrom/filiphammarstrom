import Foundation
import Network
import CoreWLAN
import OSLog

final class NetworkMonitor: ObservableObject {
    @Published private(set) var currentSSID: String? = nil
    @Published private(set) var isWiFiConnected: Bool = false

    private let pathMonitor = NWPathMonitor(requiredInterfaceType: .wifi)
    private let monitorQueue = DispatchQueue(label: "com.filiphammarstrom.NASBackup.NetworkMonitor", qos: .background)

    func start() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            let connected = path.status == .satisfied
            DispatchQueue.main.async {
                self?.isWiFiConnected = connected
                self?.refreshSSID()
            }
        }
        pathMonitor.start(queue: monitorQueue)
        Logger.network.info("NetworkMonitor started")
    }

    func stop() {
        pathMonitor.cancel()
        Logger.network.info("NetworkMonitor stopped")
    }

    private func refreshSSID() {
        // CWWiFiClient requires CoreWLAN — available on macOS without location permission on 13,
        // but macOS 14+ may require location entitlement. We attempt it and fall back gracefully.
        let ssid = CWWiFiClient.shared().interface()?.ssid()
        if currentSSID != ssid {
            Logger.network.info("SSID changed: \(ssid ?? "nil")")
            currentSSID = ssid
        }
    }
}
