import Foundation
import UsageCore

public struct FileSnapshotStore {
    public let directoryURL: URL
    public let fileName: String
    private let fileManager: FileManager

    public init(
        directoryURL: URL,
        fileName: String = AppGroupConstants.snapshotFileName,
        fileManager: FileManager = .default
    ) {
        self.directoryURL = directoryURL
        self.fileName = fileName
        self.fileManager = fileManager
    }

    public var snapshotURL: URL {
        directoryURL.appendingPathComponent(fileName, isDirectory: false)
    }

    public func readSnapshot(fallback: WidgetSnapshotDTO? = nil) -> SnapshotReadState {
        guard fileManager.fileExists(atPath: snapshotURL.path) else {
            if let fallback {
                return .loaded(fallback)
            }
            return .missing
        }

        do {
            let data = try Data(contentsOf: snapshotURL)
            let snapshot = try WidgetSnapshotDecoder.decode(data)
            return .loaded(snapshot)
        } catch WidgetSnapshotDecodeError.emptyData {
            return .empty
        } catch WidgetSnapshotDecodeError.unsupportedSchemaVersion(let version) {
            return .unsupportedVersion(version)
        } catch {
            return .corrupted(String(describing: error))
        }
    }

    public func writeSnapshot(_ data: Data) throws {
        try fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        let temporaryURL = directoryURL.appendingPathComponent("\(fileName).tmp", isDirectory: false)
        try data.write(to: temporaryURL, options: .atomic)

        if fileManager.fileExists(atPath: snapshotURL.path) {
            _ = try fileManager.replaceItemAt(snapshotURL, withItemAt: temporaryURL)
        } else {
            try fileManager.moveItem(at: temporaryURL, to: snapshotURL)
        }
    }
}
