import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFixture } from "./support/fixtures.mjs";
import { PROVIDER_ERROR_CODE } from "../src/providers/provider-adapter.mjs";
import { parseAnthropicUsageFixture } from "../src/providers/anthropic/anthropic-usage-parser.mjs";

const account = { id: "anthropic-fixture", displayName: "Anthropic Fixture" };
const now = "2026-06-18T12:00:00.000Z";

describe("Anthropic usage parser", () => {
  it("normalizes usage and costs into a provider account snapshot", () => {
    const result = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/usage-normal.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-normal.json"),
      account,
      budgetUsd: 50,
      now
    });

    assert.equal(result.ok, true);
    assert.equal(result.account.provider, "anthropic");
    assert.equal(result.account.snapshot.periodStart, "2026-06-01T00:00:00.000Z");
    assert.equal(result.account.snapshot.periodEnd, "2026-06-02T00:00:00.000Z");
    assert.deepEqual(result.account.snapshot.metrics, {
      costUsd: 20,
      budgetUsd: 50,
      inputTokens: 630000,
      outputTokens: 160000,
      totalTokens: 790000
    });
  });

  it("handles empty usage and cost reports", () => {
    const result = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/usage-empty.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-empty.json"),
      account,
      budgetUsd: 50,
      now
    });

    assert.equal(result.ok, true);
    assert.equal(result.account.snapshot.periodStart, null);
    assert.equal(result.account.snapshot.metrics.costUsd, 0);
    assert.equal(result.account.snapshot.metrics.totalTokens, 0);
  });

  it("handles alternate field names and pagination metadata", () => {
    const result = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/usage-partial.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-partial.json"),
      account,
      budgetUsd: 10,
      now
    });

    assert.equal(result.ok, true);
    assert.equal(result.account.snapshot.periodStart, "2026-06-01T00:00:00.000Z");
    assert.equal(result.account.snapshot.periodEnd, "2026-06-02T00:00:00.000Z");
    assert.equal(result.account.snapshot.metrics.inputTokens, 100);
    assert.equal(result.account.snapshot.metrics.outputTokens, 20);
    assert.equal(result.account.snapshot.metrics.costUsd, 1.5);
    assert.deepEqual(result.pageInfo, {
      usageHasMore: true,
      usageNextPage: "anthropic_page_fixture_next",
      costsHasMore: false,
      costsNextPage: null
    });
  });

  it("maps Anthropic Admin API errors into provider errors", () => {
    const unauthorized = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/error-401.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-empty.json"),
      account,
      budgetUsd: 50,
      now
    });
    const forbidden = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/error-403.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-empty.json"),
      account,
      budgetUsd: 50,
      now
    });
    const unsupported = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/error-404.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-empty.json"),
      account,
      budgetUsd: 50,
      now
    });
    const rateLimited = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/error-429.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-empty.json"),
      account,
      budgetUsd: 50,
      now
    });
    const serverError = parseAnthropicUsageFixture({
      usage: readFixture("fixtures/providers/anthropic/error-500.json"),
      costs: readFixture("fixtures/providers/anthropic/costs-empty.json"),
      account,
      budgetUsd: 50,
      now
    });

    assert.equal(unauthorized.error.code, PROVIDER_ERROR_CODE.AUTH_FAILED);
    assert.equal(forbidden.error.code, PROVIDER_ERROR_CODE.FORBIDDEN);
    assert.equal(unsupported.error.code, PROVIDER_ERROR_CODE.NOT_FOUND);
    assert.equal(rateLimited.error.code, PROVIDER_ERROR_CODE.RATE_LIMITED);
    assert.equal(rateLimited.error.retryable, true);
    assert.equal(serverError.error.code, PROVIDER_ERROR_CODE.SERVER_ERROR);
    assert.equal(serverError.error.retryable, true);
  });
});
