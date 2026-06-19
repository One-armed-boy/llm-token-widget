import XCTest
@testable import UsageCore

final class WidgetSnapshotDecoderTests: XCTestCase {
    func testRejectsUnsupportedSchemaVersion() {
        let json = #"{"schemaVersion":2,"generatedAt":"2026-06-18T12:00:00.000Z","recommendation":{"bestAccountId":null,"riskyAccountIds":[],"staleAccountIds":[],"authFailedAccountIds":[]},"accounts":[],"counts":{"total":0,"ok":0,"risky":0,"stale":0,"authFailed":0,"unsupported":0,"unknown":0}}"#

        XCTAssertThrowsError(try WidgetSnapshotDecoder.decode(Data(json.utf8))) { error in
            XCTAssertEqual(error as? WidgetSnapshotDecodeError, .unsupportedSchemaVersion(2))
        }
    }
}
