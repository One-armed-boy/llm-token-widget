import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { collectScenarioSnapshot } from "../src/collectors/collector-scenario.mjs";
import { createMockHttpClient } from "../src/collectors/mock-http-client.mjs";
import { buildMockE2EReport, buildWidgetSnapshot } from "../src/core/widget-snapshot.mjs";

const fixturePath = "fixtures/scenarios/mock-accounts.json";
const outputDir = "reports/mock-e2e";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const snapshot = buildWidgetSnapshot(fixture.accounts, { now: fixture.now });
const summary = buildMockE2EReport(fixture.accounts, { now: fixture.now });
const collectorScenario = await collectScenarioSnapshot(collectorConfigs(fixture.now), mockClientForConfig, { now: fixture.now });
const collectorSummary = buildCollectorSummary(collectorScenario.results, collectorScenario.snapshot);

writeJson(join(outputDir, "widget-snapshot.json"), snapshot);
writeJson(join(outputDir, "summary.json"), summary);
writeJson(join(outputDir, "collector-summary.json"), collectorSummary);

console.log(`Wrote ${join(outputDir, "widget-snapshot.json")}`);
console.log(`Wrote ${join(outputDir, "collector-summary.json")}`);
console.log(`Best account: ${summary.bestAccountId ?? "none"}`);

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function collectorConfigs(now) {
  return [
    openAIConfig("openai-collector-ok", "OpenAI Collector OK", 100, "normal", now),
    openAIConfig("openai-collector-risk", "OpenAI Collector Risk", 45, "normal", now),
    openAIConfig("openai-collector-rate-limited", "OpenAI Collector Rate Limited", 100, "rateLimited", now),
    anthropicConfig("anthropic-collector-forbidden", "Anthropic Collector Forbidden", 50, "forbidden", now)
  ];
}

function mockClientForConfig(config) {
  if (config.provider === "openai" && config.fixtureKind === "rateLimited") {
    return createMockHttpClient([
      { name: "usage", path: "/v1/organization/usage/completions", error: { status: 429, message: "rate limited" } },
      { name: "costs", path: "/v1/organization/costs", json: readJson("fixtures/providers/openai/costs-empty.json") }
    ]);
  }

  if (config.provider === "openai") {
    return createMockHttpClient([
      { name: "usage", path: "/v1/organization/usage/completions", json: readJson("fixtures/providers/openai/usage-normal.json") },
      { name: "costs", path: "/v1/organization/costs", json: readJson("fixtures/providers/openai/costs-normal.json") }
    ]);
  }

  if (config.provider === "anthropic" && config.fixtureKind === "forbidden") {
    return createMockHttpClient([
      { name: "usage", path: "/v1/organizations/usage_report/messages", error: { status: 403, message: "forbidden" } },
      { name: "costs", path: "/v1/organizations/cost_report", json: readJson("fixtures/providers/anthropic/costs-empty.json") }
    ]);
  }

  return createMockHttpClient([
    { name: "usage", path: "/v1/organizations/usage_report/messages", json: readJson("fixtures/providers/anthropic/usage-normal.json") },
    { name: "costs", path: "/v1/organizations/cost_report", json: readJson("fixtures/providers/anthropic/costs-normal.json") }
  ]);
}

function buildCollectorSummary(results, collectorSnapshot) {
  return {
    generatedAt: collectorSnapshot.generatedAt,
    counts: collectorSnapshot.counts,
    recommendation: collectorSnapshot.recommendation,
    accounts: results.map((result) => ({
      id: result.account.id,
      provider: result.provider,
      ok: result.ok,
      health: collectorSnapshot.accounts.find((account) => account.id === result.account.id)?.health ?? "unknown",
      errorCode: result.error?.code ?? null,
      retryable: result.error?.retryable ?? false,
      requests: result.requestPlan.requests.map((request) => ({
        name: request.name,
        method: request.method,
        url: request.url,
        redactedHeaders: request.redactedHeaders
      }))
    }))
  };
}

function openAIConfig(accountId, displayName, budgetUsd, fixtureKind, now) {
  return {
    provider: "openai",
    accountId,
    displayName,
    apiKey: "openai-mock-e2e-secret",
    budgetUsd,
    fixtureKind,
    now,
    period: { startTime: 1780272000, endTime: 1782950400 }
  };
}

function anthropicConfig(accountId, displayName, budgetUsd, fixtureKind, now) {
  return {
    provider: "anthropic",
    accountId,
    displayName,
    apiKey: "anthropic-mock-e2e-secret",
    budgetUsd,
    fixtureKind,
    now,
    period: { startTime: "2026-06-01T00:00:00.000Z", endTime: "2026-06-30T23:59:59.000Z" }
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
