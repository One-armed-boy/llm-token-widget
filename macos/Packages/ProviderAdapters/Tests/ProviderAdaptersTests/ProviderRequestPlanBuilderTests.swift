import XCTest
@testable import ProviderAdapters

final class ProviderRequestPlanBuilderTests: XCTestCase {
    func testBuildsOpenAIUsageAndCostsRequests() throws {
        let plan = try ProviderRequestPlanBuilder.buildOpenAI(
            OpenAIRequestPlanConfig(
                accountId: "openai-prod",
                apiKey: "openai-test-secret-should-not-leak",
                period: UnixSecondsPeriod(startTime: 1_780_272_000, endTime: 1_782_950_400),
                limit: 30,
                groupBy: ["project_id", "api_key_id"],
                usagePage: "usage-next",
                costsPage: "costs-next"
            )
        )

        XCTAssertEqual(plan.provider, .openai)
        XCTAssertEqual(plan.accountId, "openai-prod")
        XCTAssertEqual(plan.requests.count, 2)
        XCTAssertEqual(plan.requests[0].name, "usage")
        XCTAssertEqual(plan.requests[0].method, "GET")
        XCTAssertEqual(plan.requests[0].url.path, "/v1/organization/usage/completions")
        XCTAssertEqual(plan.requests[1].url.path, "/v1/organization/costs")
        XCTAssertTrue(plan.requests[0].url.absoluteString.contains("start_time=1780272000"))
        XCTAssertTrue(plan.requests[0].url.absoluteString.contains("group_by=project_id"))
        XCTAssertTrue(plan.requests[0].url.absoluteString.contains("group_by=api_key_id"))
        XCTAssertEqual(plan.requests[0].headers["Authorization"], ["Bearer", "openai-test-secret-should-not-leak"].joined(separator: " "))

        let redacted = plan.redacted()
        XCTAssertEqual(redacted.requests[0].redactedHeaders["Authorization"], "[redacted]")
        XCTAssertFalse(String(describing: redacted).contains("openai-test-secret-should-not-leak"))
    }

    func testBuildsAnthropicUsageAndCostsRequests() throws {
        let plan = try ProviderRequestPlanBuilder.buildAnthropic(
            AnthropicRequestPlanConfig(
                accountId: "anthropic-team",
                apiKey: "anthropic-secret-should-not-leak",
                period: DateStringPeriod(
                    startTime: "2026-06-01T00:00:00.000Z",
                    endTime: "2026-06-30T23:59:59.000Z"
                ),
                limit: 31,
                usagePage: "usage-next"
            )
        )

        XCTAssertEqual(plan.provider, .anthropic)
        XCTAssertEqual(plan.requests[0].url.path, "/v1/organizations/usage_report/messages")
        XCTAssertEqual(plan.requests[1].url.path, "/v1/organizations/cost_report")
        XCTAssertTrue(plan.requests[0].url.absoluteString.contains("starting_at=2026-06-01"))
        XCTAssertTrue(plan.requests[0].url.absoluteString.contains("ending_at=2026-06-30"))
        XCTAssertEqual(plan.requests[0].headers["x-api-key"], "anthropic-secret-should-not-leak")
        XCTAssertEqual(plan.requests[0].headers["anthropic-version"], "2023-06-01")

        let redacted = plan.redacted()
        XCTAssertFalse(String(describing: redacted).contains("anthropic-secret-should-not-leak"))
    }

    func testValidatesRequestConfiguration() {
        XCTAssertThrowsError(
            try ProviderRequestPlanBuilder.buildOpenAI(
                OpenAIRequestPlanConfig(
                    accountId: "openai-prod",
                    apiKey: "",
                    period: UnixSecondsPeriod(startTime: 1)
                )
            )
        ) { error in
            XCTAssertEqual(error as? ProviderRequestPlanError, .apiKeyRequired)
        }

        XCTAssertThrowsError(
            try ProviderRequestPlanBuilder.buildOpenAI(
                OpenAIRequestPlanConfig(
                    accountId: "openai-prod",
                    apiKey: "secret",
                    period: UnixSecondsPeriod(startTime: 0)
                )
            )
        ) { error in
            XCTAssertEqual(error as? ProviderRequestPlanError, .invalidUnixSeconds("period.startTime"))
        }

        XCTAssertThrowsError(
            try ProviderRequestPlanBuilder.buildAnthropic(
                AnthropicRequestPlanConfig(
                    accountId: "anthropic-team",
                    apiKey: "secret",
                    period: DateStringPeriod(startTime: "not-a-date")
                )
            )
        ) { error in
            XCTAssertEqual(error as? ProviderRequestPlanError, .invalidDate("period.startTime"))
        }

        XCTAssertThrowsError(
            try ProviderRequestPlanBuilder.buildOpenAI(
                OpenAIRequestPlanConfig(
                    accountId: "openai-prod",
                    apiKey: "secret",
                    period: UnixSecondsPeriod(startTime: 1),
                    limit: 181
                )
            )
        ) { error in
            XCTAssertEqual(error as? ProviderRequestPlanError, .invalidLimit)
        }
    }
}
