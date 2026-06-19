import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildProviderRequestPlan, redactRequestPlan } from "../src/collectors/provider-request-plan.mjs";

describe("provider request plan", () => {
  it("builds OpenAI usage and costs requests without leaking secrets in redacted output", () => {
    const expectedAuthorization = ["Bearer", "openai-test-secret-should-not-leak"].join(" ");
    const plan = buildProviderRequestPlan({
      provider: "openai",
      accountId: "openai-prod",
      apiKey: "openai-test-secret-should-not-leak",
      period: { startTime: 1780272000, endTime: 1782950400 },
      limit: 30,
      groupBy: ["project_id", "api_key_id"],
      usagePage: "usage-next",
      costsPage: "costs-next"
    });

    assert.equal(plan.requests.length, 2);
    assert.match(plan.requests[0].url, /\/v1\/organization\/usage\/completions/);
    assert.match(plan.requests[1].url, /\/v1\/organization\/costs/);
    assert.match(plan.requests[0].url, /start_time=1780272000/);
    assert.match(plan.requests[0].url, /group_by=project_id/);
    assert.match(plan.requests[0].url, /group_by=api_key_id/);
    assert.equal(plan.requests[0].headers.Authorization, expectedAuthorization);

    const redacted = redactRequestPlan(plan);
    assert.equal(JSON.stringify(redacted).includes("openai-test-secret-should-not-leak"), false);
    assert.equal(redacted.requests[0].redactedHeaders.Authorization, "[redacted]");
  });

  it("builds Anthropic usage and costs requests using date query parameters", () => {
    const plan = buildProviderRequestPlan({
      provider: "anthropic",
      accountId: "anthropic-team",
      apiKey: "anthropic-secret-should-not-leak",
      period: { startTime: "2026-06-01T00:00:00.000Z", endTime: "2026-06-30T23:59:59.000Z" },
      limit: 31,
      usagePage: "usage-next"
    });

    assert.match(plan.requests[0].url, /\/v1\/organizations\/usage_report\/messages/);
    assert.match(plan.requests[1].url, /\/v1\/organizations\/cost_report/);
    assert.match(plan.requests[0].url, /starting_at=2026-06-01/);
    assert.match(plan.requests[0].url, /ending_at=2026-06-30/);
    assert.equal(plan.requests[0].headers["x-api-key"], "anthropic-secret-should-not-leak");
    assert.equal(plan.requests[0].headers["anthropic-version"], "2023-06-01");

    const redacted = redactRequestPlan(plan);
    assert.equal(JSON.stringify(redacted).includes("anthropic-secret-should-not-leak"), false);
  });

  it("validates provider request configuration", () => {
    assert.throws(() => buildProviderRequestPlan({ provider: "openai", apiKey: "", period: { startTime: 1 } }), /apiKey is required/);
    assert.throws(() => buildProviderRequestPlan({ provider: "openai", apiKey: "sk", period: { startTime: "bad" } }), /unix seconds/);
    assert.throws(() => buildProviderRequestPlan({
      provider: "anthropic",
      apiKey: "ak",
      period: { startTime: "not-a-date" }
    }), /ISO date/);
    assert.throws(() => buildProviderRequestPlan({
      provider: "unknown",
      apiKey: "secret",
      period: { startTime: 1780272000 }
    }), /Unsupported provider/);
  });
});
