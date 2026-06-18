import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { configFromEnv, dryRunConfigFromEnv, runRealProviderDryRun } from "../scripts/real-provider-e2e.mjs";

describe("real provider E2E command config", () => {
  it("builds OpenAI config from explicit opt-in environment", () => {
    const config = configFromEnv("openai", {
      OPENAI_ADMIN_KEY: "openai-real-secret",
      REAL_E2E_ACCOUNT_ID: "openai-real",
      REAL_E2E_DISPLAY_NAME: "OpenAI Real",
      REAL_E2E_BUDGET_USD: "100",
      REAL_E2E_NOW: "2026-06-18T12:00:00.000Z",
      REAL_E2E_START_TIME: "1780272000",
      REAL_E2E_END_TIME: "1782950400"
    });

    assert.deepEqual(config, {
      provider: "openai",
      accountId: "openai-real",
      displayName: "OpenAI Real",
      apiKey: "openai-real-secret",
      budgetUsd: 100,
      now: "2026-06-18T12:00:00.000Z",
      period: {
        startTime: 1780272000,
        endTime: 1782950400
      }
    });
  });

  it("builds Anthropic config from explicit opt-in environment", () => {
    const config = configFromEnv("anthropic", {
      ANTHROPIC_ADMIN_KEY: "anthropic-real-secret",
      REAL_E2E_NOW: "2026-06-18T12:00:00.000Z",
      REAL_E2E_START_DATE: "2026-06-01T00:00:00.000Z",
      REAL_E2E_END_DATE: "2026-06-30T23:59:59.000Z"
    });

    assert.equal(config.provider, "anthropic");
    assert.equal(config.accountId, "anthropic-real");
    assert.equal(config.apiKey, "anthropic-real-secret");
    assert.deepEqual(config.period, {
      startTime: "2026-06-01T00:00:00.000Z",
      endTime: "2026-06-30T23:59:59.000Z"
    });
  });

  it("fails without provider credentials and period configuration", () => {
    assert.throws(() => configFromEnv("openai", {}), /OPENAI_ADMIN_KEY is required/);
    assert.throws(() => configFromEnv("anthropic", {}), /ANTHROPIC_ADMIN_KEY is required/);
    assert.throws(() => configFromEnv("openai", {
      OPENAI_ADMIN_KEY: "sk",
      REAL_E2E_START_TIME: "not-number"
    }), /REAL_E2E_START_TIME must be unix seconds/);
  });

  it("builds dry-run config without provider credentials", () => {
    const openai = dryRunConfigFromEnv("openai", { REAL_E2E_NOW: "2026-06-18T12:00:00.000Z" });
    const anthropic = dryRunConfigFromEnv("anthropic", { REAL_E2E_NOW: "2026-06-18T12:00:00.000Z" });

    assert.equal(openai.apiKey, "dry-run-openai-secret");
    assert.equal(openai.period.startTime, 1780272000);
    assert.equal(anthropic.apiKey, "dry-run-anthropic-secret");
    assert.equal(anthropic.period.startTime, "2026-06-01T00:00:00.000Z");
  });

  it("writes redacted dry-run request plan artifacts", () => {
    const result = runRealProviderDryRun({
      provider: "openai",
      env: { REAL_E2E_NOW: "2026-06-18T12:00:00.000Z" },
      output: { log() {} }
    });
    const text = readFileSync(result.outputPath, "utf8");
    const artifact = JSON.parse(text);

    assert.equal(result.outputPath, "reports/real-e2e/openai-dry-run.json");
    assert.equal(text.includes("dry-run-openai-secret"), false);
    assert.match(artifact.requestPlan.requests[0].url, /organization\/usage\/completions/);
    assert.equal(artifact.requestPlan.requests[0].redactedHeaders.Authorization, "[redacted]");
  });
});
