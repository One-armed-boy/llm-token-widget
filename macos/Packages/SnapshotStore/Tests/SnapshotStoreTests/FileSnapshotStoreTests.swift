import Foundation
import UsageCore
import XCTest
@testable import SnapshotStore

final class FileSnapshotStoreTests: XCTestCase {
    func testReadsMissingSnapshotAsMissing() throws {
        let store = FileSnapshotStore(directoryURL: try temporaryDirectory())
        XCTAssertEqual(store.readSnapshot(), .missing)
    }

    func testReadsUnsupportedVersion() throws {
        let directory = try temporaryDirectory()
        let store = FileSnapshotStore(directoryURL: directory)
        let json = #"{"schemaVersion":99,"generatedAt":"2026-06-18T12:00:00.000Z","recommendation":{"bestAccountId":null,"riskyAccountIds":[],"staleAccountIds":[],"authFailedAccountIds":[]},"accounts":[],"counts":{"total":0,"ok":0,"risky":0,"stale":0,"authFailed":0,"unsupported":0,"unknown":0}}"#

        try store.writeSnapshot(Data(json.utf8))

        XCTAssertEqual(store.readSnapshot(), .unsupportedVersion(99))
    }

    func testReadsWrittenValidSnapshotAndRemovesTemporaryFile() throws {
        let directory = try temporaryDirectory()
        let store = FileSnapshotStore(directoryURL: directory)

        try store.writeSnapshot(validSnapshotData())

        guard case .loaded(let snapshot) = store.readSnapshot() else {
            return XCTFail("Expected loaded snapshot")
        }
        XCTAssertEqual(snapshot.recommendation.bestAccountId, "openai-prod")
        XCTAssertFalse(FileManager.default.fileExists(atPath: directory.appendingPathComponent("widget-snapshot.json.tmp").path))
    }

    func testReadsEmptySnapshotAsEmpty() throws {
        let directory = try temporaryDirectory()
        let store = FileSnapshotStore(directoryURL: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        FileManager.default.createFile(atPath: store.snapshotURL.path, contents: Data())

        XCTAssertEqual(store.readSnapshot(), .empty)
    }

    func testReadsInvalidJSONAsCorrupted() throws {
        let directory = try temporaryDirectory()
        let store = FileSnapshotStore(directoryURL: directory)
        try store.writeSnapshot(Data(#"{"schemaVersion":1,"#.utf8))

        guard case .corrupted = store.readSnapshot() else {
            return XCTFail("Expected corrupted snapshot")
        }
    }

    private func temporaryDirectory() throws -> URL {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private func validSnapshotData() -> Data {
        Data(#"{"schemaVersion":1,"generatedAt":"2026-06-18T12:00:00.000Z","recommendation":{"bestAccountId":"openai-prod","riskyAccountIds":[],"staleAccountIds":[],"authFailedAccountIds":[]},"accounts":[{"id":"openai-prod","provider":"openai","displayName":"OpenAI Prod","health":"ok","usagePercent":21.3,"lastUpdatedAt":"2026-06-18T11:45:00.000Z","periodStart":"2026-06-01T00:00:00.000Z","periodEnd":"2026-06-30T23:59:59.000Z","metrics":{"costUsd":42.5,"budgetUsd":200,"inputTokens":1250000,"outputTokens":410000,"totalTokens":1660000}}],"counts":{"total":1,"ok":1,"risky":0,"stale":0,"authFailed":0,"unsupported":0,"unknown":0}}"#.utf8)
    }
}
