import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auditSnapshot } from "../scripts/snapshot-audit.mjs";
import { collectScenarioSnapshot } from "../src/collectors/collector-scenario.mjs";
import { createMockHttpClient } from "../src/collectors/mock-http-client.mjs";
import { readFixture } from "./support/fixtures.mjs";

const now = "2026-06-18T12:00:00.000Z";

describe("collector E2E", () => {
  it("collects mixed provider outcomes into an auditable widget snapshot", async () => {
    const configs = [
      openAIConfig("openai-ok", "OpenAI OK", 100, "normal"),
      openAIConfig("openai-risk", "OpenAI Risk", 45, "normal"),
      openAIConfig("openai-rate-limited", "OpenAI Rate Limited", 100, "rateLimited"),
      anthropicConfig("anthropic-forbidden", "Anthropic Forbidden", 50, "forbidden")
    ];
    const { results, snapshot } = await collectScenarioSnapshot(configs, mockClientForConfig, { now });

    assert.equal(results.length, 4);
    assert.deepEqual(results.map((result) => result.ok), [true, true, false, false]);
    assert.equal(snapshot.recommendation.bestAccountId, "openai-ok");
    assert.deepEqual(snapshot.recommendation.riskyAccountIds, ["openai-risk"]);
    assert.deepEqual(snapshot.recommendation.authFailedAccountIds, ["anthropic-forbidden"]);
    assert.equal(snapshot.counts.ok, 1);
    assert.equal(snapshot.counts.risky, 1);
    assert.equal(snapshot.counts.authFailed, 1);
    assert.equal(snapshot.counts.unknown, 1);
    assert.equal(JSON.stringify(results).includes("openai-e2e-secret"), false);
    assert.equal(JSON.stringify(results).includes("anthropic-e2e-secret"), false);
    assert.equal(auditSnapshot(snapshot).ok, true);
  });
});

function mockClientForConfig(config) {
  if (config.provider === "openai" && config.fixtureKind === "rateLimited") {
    return createMockHttpClient([
      { name: "usage", path: "/v1/organization/usage/completions", error: { status: 429, message: "rate limited" } },
      { name: "costs", path: "/v1/organization/costs", json: readFixture("fixtures/providers/openai/costs-empty.json") }
    ]);
  }

  if (config.provider === "openai") {
    return createMockHttpClient([
      { name: "usage", path: "/v1/organization/usage/completions", json: readFixture("fixtures/providers/openai/usage-normal.json") },
      { name: "costs", path: "/v1/organization/costs", json: readFixture("fixtures/providers/openai/costs-normal.json") }
    ]);
  }

  if (config.provider === "anthropic" && config.fixtureKind === "forbidden") {
    return createMockHttpClient([
      { name: "usage", path: "/v1/organizations/usage_report/messages", error: { status: 403, message: "forbidden" } },
      { name: "costs", path: "/v1/organizations/cost_report", json: readFixture("fixtures/providers/anthropic/costs-empty.json") }
    ]);
  }

  return createMockHttpClient([
    { name: "usage", path: "/v1/organizations/usage_report/messages", json: readFixture("fixtures/providers/anthropic/usage-normal.json") },
    { name: "costs", path: "/v1/organizations/cost_report", json: readFixture("fixtures/providers/anthropic/costs-normal.json") }
  ]);
}

function openAIConfig(accountId, displayName, budgetUsd, fixtureKind) {
  return {
    provider: "openai",
    accountId,
    displayName,
    apiKey: "openai-e2e-secret",
    budgetUsd,
    fixtureKind,
    now,
    period: { startTime: 1780272000, endTime: 1782950400 }
  };
}

function anthropicConfig(accountId, displayName, budgetUsd, fixtureKind) {
  return {
    provider: "anthropic",
    accountId,
    displayName,
    apiKey: "anthropic-e2e-secret",
    budgetUsd,
    fixtureKind,
    now,
    period: { startTime: "2026-06-01T00:00:00.000Z", endTime: "2026-06-30T23:59:59.000Z" }
  };
}
