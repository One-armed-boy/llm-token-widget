import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMockHttpClient } from "../src/collectors/mock-http-client.mjs";
import { collectAccountUsage } from "../src/collectors/usage-collector.mjs";
import { PROVIDER_ERROR_CODE } from "../src/providers/provider-adapter.mjs";
import { readFixture } from "./support/fixtures.mjs";

const now = "2026-06-18T12:00:00.000Z";

describe("usage collector", () => {
  it("collects OpenAI usage through a mock HTTP client", async () => {
    const httpClient = createMockHttpClient([
      { name: "usage", path: "/v1/organization/usage/completions", json: readFixture("fixtures/providers/openai/usage-normal.json") },
      { name: "costs", path: "/v1/organization/costs", json: readFixture("fixtures/providers/openai/costs-normal.json") }
    ]);
    const result = await collectAccountUsage(openAIConfig(), httpClient);

    assert.equal(result.ok, true);
    assert.equal(result.account.id, "openai-collector");
    assert.equal(result.account.snapshot.metrics.costUsd, 42.5);
    assert.equal(httpClient.calls.length, 2);
    assert.equal(JSON.stringify(result.requestPlan).includes("openai-collector-secret"), false);
    assert.equal(JSON.stringify(httpClient.calls).includes("openai-collector-secret"), false);
  });

  it("collects Anthropic usage through a mock HTTP client", async () => {
    const httpClient = createMockHttpClient([
      { name: "usage", path: "/v1/organizations/usage_report/messages", json: readFixture("fixtures/providers/anthropic/usage-normal.json") },
      { name: "costs", path: "/v1/organizations/cost_report", json: readFixture("fixtures/providers/anthropic/costs-normal.json") }
    ]);
    const result = await collectAccountUsage(anthropicConfig(), httpClient);

    assert.equal(result.ok, true);
    assert.equal(result.account.provider, "anthropic");
    assert.equal(result.account.snapshot.metrics.costUsd, 20);
    assert.equal(JSON.stringify(result.requestPlan).includes("anthropic-collector-secret"), false);
  });

  it("maps HTTP errors into collector account states", async () => {
    const httpClient = createMockHttpClient([
      { name: "usage", path: "/v1/organization/usage/completions", error: { status: 429, message: "rate limited" } },
      { name: "costs", path: "/v1/organization/costs", json: readFixture("fixtures/providers/openai/costs-empty.json") }
    ]);
    const result = await collectAccountUsage(openAIConfig(), httpClient);

    assert.equal(result.ok, false);
    assert.equal(result.error.code, PROVIDER_ERROR_CODE.RATE_LIMITED);
    assert.equal(result.error.retryable, true);
    assert.equal(result.account.credentialStatus, "valid");
    assert.equal(result.account.snapshot, undefined);
  });
});

function openAIConfig() {
  return {
    provider: "openai",
    accountId: "openai-collector",
    displayName: "OpenAI Collector",
    apiKey: "openai-collector-secret",
    budgetUsd: 100,
    now,
    period: { startTime: 1780272000, endTime: 1782950400 }
  };
}

function anthropicConfig() {
  return {
    provider: "anthropic",
    accountId: "anthropic-collector",
    displayName: "Anthropic Collector",
    apiKey: "anthropic-collector-secret",
    budgetUsd: 50,
    now,
    period: { startTime: "2026-06-01T00:00:00.000Z", endTime: "2026-06-30T23:59:59.000Z" }
  };
}
