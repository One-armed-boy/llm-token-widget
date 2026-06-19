import Foundation
import UsageCore

public struct AppGroupSnapshotStore {
    public let appGroupId: String
    public let fileName: String
    private let fileManager: FileManager

    public init(
        appGroupId: String,
        fileName: String = AppGroupConstants.snapshotFileName,
        fileManager: FileManager = .default
    ) {
        self.appGroupId = appGroupId
        self.fileName = fileName
        self.fileManager = fileManager
    }

    public func readSnapshot(fallback: WidgetSnapshotDTO? = nil) -> SnapshotReadState {
        guard let containerURL = fileManager.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
            if let fallback {
                return .loaded(fallback)
            }
            return .missing
        }

        return FileSnapshotStore(directoryURL: containerURL, fileName: fileName).readSnapshot(fallback: fallback)
    }
}
