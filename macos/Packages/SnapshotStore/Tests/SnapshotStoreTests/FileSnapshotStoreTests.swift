import Foundation
import UsageCore
import XCTest
@testable import SnapshotStore

final class FileSnapshotStoreTests: XCTestCase {
    func testReadsMissingSnapshotAsMissing() {
        let store = FileSnapshotStore(directoryURL: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
        XCTAssertEqual(store.readSnapshot(), .missing)
    }

    func testReadsUnsupportedVersion() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let store = FileSnapshotStore(directoryURL: directory)
        let json = #"{"schemaVersion":99,"generatedAt":"2026-06-18T12:00:00.000Z","recommendation":{"bestAccountId":null,"riskyAccountIds":[],"staleAccountIds":[],"authFailedAccountIds":[]},"accounts":[],"counts":{"total":0,"ok":0,"risky":0,"stale":0,"authFailed":0,"unsupported":0,"unknown":0}}"#

        try store.writeSnapshot(Data(json.utf8))

        XCTAssertEqual(store.readSnapshot(), .unsupportedVersion(99))
    }
}
