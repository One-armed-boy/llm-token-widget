import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFixture } from "./support/fixtures.mjs";
import { PROVIDER_ERROR_CODE } from "../src/providers/provider-adapter.mjs";
import { parseOpenAIUsageFixture } from "../src/providers/openai/openai-usage-parser.mjs";

const account = { id: "openai-fixture", displayName: "OpenAI Fixture" };
const now = "2026-06-18T12:00:00.000Z";

describe("OpenAI usage parser", () => {
  it("normalizes usage and costs into a provider account snapshot", () => {
    const result = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/usage-normal.json"),
      costs: readFixture("fixtures/providers/openai/costs-normal.json"),
      account,
      budgetUsd: 100,
      now
    });

    assert.equal(result.ok, true);
    assert.equal(result.account.provider, "openai");
    assert.equal(result.account.snapshot.periodStart, "2026-06-01T00:00:00.000Z");
    assert.equal(result.account.snapshot.periodEnd, "2026-06-03T00:00:00.000Z");
    assert.deepEqual(result.account.snapshot.metrics, {
      costUsd: 42.5,
      budgetUsd: 100,
      inputTokens: 1310000,
      outputTokens: 415000,
      totalTokens: 1725000
    });
  });

  it("handles empty usage and cost pages", () => {
    const result = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/usage-empty.json"),
      costs: readFixture("fixtures/providers/openai/costs-empty.json"),
      account,
      budgetUsd: 100,
      now
    });

    assert.equal(result.ok, true);
    assert.equal(result.account.snapshot.periodStart, null);
    assert.equal(result.account.snapshot.metrics.costUsd, 0);
    assert.equal(result.account.snapshot.metrics.totalTokens, 0);
  });

  it("handles partial usage fields and pagination metadata", () => {
    const result = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/usage-partial.json"),
      costs: readFixture("fixtures/providers/openai/costs-pagination.json"),
      account,
      budgetUsd: 25,
      now
    });

    assert.equal(result.ok, true);
    assert.equal(result.account.snapshot.metrics.inputTokens, 100);
    assert.equal(result.account.snapshot.metrics.outputTokens, 0);
    assert.equal(result.account.snapshot.metrics.costUsd, 3.5);
    assert.deepEqual(result.pageInfo, {
      usageHasMore: false,
      usageNextPage: null,
      costsHasMore: true,
      costsNextPage: "page_fixture_next"
    });
  });

  it("maps OpenAI API errors into provider errors", () => {
    const unauthorized = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/error-401.json"),
      costs: readFixture("fixtures/providers/openai/costs-empty.json"),
      account,
      budgetUsd: 100,
      now
    });
    const forbidden = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/error-403.json"),
      costs: readFixture("fixtures/providers/openai/costs-empty.json"),
      account,
      budgetUsd: 100,
      now
    });
    const rateLimited = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/error-429.json"),
      costs: readFixture("fixtures/providers/openai/costs-empty.json"),
      account,
      budgetUsd: 100,
      now
    });
    const serverError = parseOpenAIUsageFixture({
      usage: readFixture("fixtures/providers/openai/error-500.json"),
      costs: readFixture("fixtures/providers/openai/costs-empty.json"),
      account,
      budgetUsd: 100,
      now
    });

    assert.equal(unauthorized.error.code, PROVIDER_ERROR_CODE.AUTH_FAILED);
    assert.equal(forbidden.error.code, PROVIDER_ERROR_CODE.FORBIDDEN);
    assert.equal(rateLimited.error.code, PROVIDER_ERROR_CODE.RATE_LIMITED);
    assert.equal(rateLimited.error.retryable, true);
    assert.equal(serverError.error.code, PROVIDER_ERROR_CODE.SERVER_ERROR);
    assert.equal(serverError.error.retryable, true);
  });
});
