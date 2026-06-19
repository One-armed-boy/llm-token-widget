import XCTest
@testable import UsageCore

final class WidgetSnapshotDecoderTests: XCTestCase {
    func testDecodesGoldenSnapshotFixture() throws {
        let snapshot = try WidgetSnapshotDecoder.decode(goldenFixtureData())

        XCTAssertEqual(snapshot.schemaVersion, 1)
        XCTAssertEqual(snapshot.recommendation.bestAccountId, "openai-prod")
        XCTAssertEqual(snapshot.accounts.count, 6)
        XCTAssertEqual(snapshot.counts.total, 6)
        XCTAssertEqual(snapshot.accounts.first?.displayName, "OpenAI Prod")
        XCTAssertEqual(snapshot.accounts.first?.usagePercent, 21.3)
        XCTAssertEqual(snapshot.accounts.first?.metrics.totalTokens, 1_660_000)
    }

    func testRejectsEmptyData() {
        XCTAssertThrowsError(try WidgetSnapshotDecoder.decode(Data())) { error in
            XCTAssertEqual(error as? WidgetSnapshotDecodeError, .emptyData)
        }
    }

    func testRejectsUnsupportedSchemaVersion() {
        let json = #"{"schemaVersion":2,"generatedAt":"2026-06-18T12:00:00.000Z","recommendation":{"bestAccountId":null,"riskyAccountIds":[],"staleAccountIds":[],"authFailedAccountIds":[]},"accounts":[],"counts":{"total":0,"ok":0,"risky":0,"stale":0,"authFailed":0,"unsupported":0,"unknown":0}}"#

        XCTAssertThrowsError(try WidgetSnapshotDecoder.decode(Data(json.utf8))) { error in
            XCTAssertEqual(error as? WidgetSnapshotDecodeError, .unsupportedSchemaVersion(2))
        }
    }

    func testDecodesPlainISO8601Timestamps() throws {
        let json = #"{"schemaVersion":1,"generatedAt":"2026-06-18T12:00:00Z","recommendation":{"bestAccountId":null,"riskyAccountIds":[],"staleAccountIds":[],"authFailedAccountIds":[]},"accounts":[],"counts":{"total":0,"ok":0,"risky":0,"stale":0,"authFailed":0,"unsupported":0,"unknown":0}}"#

        let snapshot = try WidgetSnapshotDecoder.decode(Data(json.utf8))
        let expectedDate = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-06-18T12:00:00Z"))

        XCTAssertEqual(snapshot.generatedAt, expectedDate)
    }

    private func goldenFixtureData() throws -> Data {
        let url = try XCTUnwrap(Bundle.module.url(forResource: "widget-snapshot.golden", withExtension: "json"))
        return try Data(contentsOf: url)
    }
}
