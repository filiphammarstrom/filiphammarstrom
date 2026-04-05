import Foundation
import Combine
import OSLog

/// Central ObservableObject that wires all services together and drives the UI.
@MainActor
final class AppEnvironment: ObservableObject {

    // MARK: - Published state

    @Published var configuration: AppConfiguration
    @Published var runHistory: [BackupRun] = []

    // MARK: - Services

    let store           = ConfigurationStore()
    let engine: BackupEngine
    let networkMonitor  = NetworkMonitor()
    let scheduleManager = ScheduleManager()
    private let sleepWakeObserver = SleepWakeObserver()
    private var cancellables: Set<AnyCancellable> = []

    // MARK: - Init

    init() {
        let cfg = ConfigurationStore().load()
        configuration = cfg
        engine = BackupEngine(store: ConfigurationStore())

        setup()
    }

    private func setup() {
        // Wire engine into schedule manager
        scheduleManager.engine = engine

        // Observe SSID changes → evaluate network triggers
        networkMonitor.$currentSSID
            .receive(on: DispatchQueue.main)
            .sink { [weak self] ssid in
                guard let self else { return }
                scheduleManager.evaluateTriggers(
                    tasks: configuration.tasks,
                    currentSSID: ssid
                )
            }
            .store(in: &cancellables)

        // Observe config changes → reschedule timers
        $configuration
            .map(\.tasks)
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] tasks in
                self?.scheduleManager.reschedule(tasks: tasks)
            }
            .store(in: &cancellables)

        // Observe completed runs → append to history
        engine.$activeRun
            .compactMap { $0 }
            .filter { $0.status != .running }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] run in
                self?.runHistory.insert(run, at: 0)
                if self?.runHistory.count ?? 0 > 200 {
                    self?.runHistory = Array(self?.runHistory.prefix(200) ?? [])
                }
            }
            .store(in: &cancellables)

        // Start services
        networkMonitor.start()
        scheduleManager.reschedule(tasks: configuration.tasks)
        sleepWakeObserver.start(
            engine: engine,
            networkMonitor: networkMonitor,
            scheduleManager: scheduleManager,
            tasks: { [weak self] in self?.configuration.tasks ?? [] }
        )

        Logger.app.info("AppEnvironment initialized")
    }

    // MARK: - Configuration mutations

    func save() {
        do {
            try store.save(configuration)
        } catch {
            Logger.app.error("Failed to save configuration: \(error.localizedDescription)")
        }
    }

    func addTask(_ task: BackupTask) {
        configuration.tasks.append(task)
        save()
    }

    func updateTask(_ task: BackupTask) {
        guard let index = configuration.tasks.firstIndex(where: { $0.id == task.id }) else { return }
        configuration.tasks[index] = task
        save()
    }

    func deleteTask(id: UUID) {
        configuration.tasks.removeAll { $0.id == id }
        save()
    }

    func startBackup(task: BackupTask) {
        engine.start(task: task)
    }

    func cancelBackup() {
        engine.cancel()
    }
}
