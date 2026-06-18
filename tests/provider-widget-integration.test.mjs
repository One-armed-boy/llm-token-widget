import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auditSnapshot } from "../scripts/snapshot-audit.mjs";
import { buildWidgetSnapshot } from "../src/core/widget-snapshot.mjs";
import { buildProviderFixtureAccounts, providerResultToAccount } from "../src/providers/provider-fixture-scenario.mjs";
import { PROVIDER_ERROR_CODE } from "../src/providers/provider-adapter.mjs";
import { readFixture } from "./support/fixtures.mjs";

const now = "2026-06-18T12:00:00.000Z";

describe("provider to widget integration", () => {
  it("builds an auditable widget snapshot from OpenAI and Anthropic provider fixtures", () => {
    const accounts = buildProviderFixtureAccounts({
      now,
      openai: {
        usage: readFixture("fixtures/providers/openai/usage-normal.json"),
        costs: readFixture("fixtures/providers/openai/costs-normal.json"),
        account: { id: "openai-from-provider", displayName: "OpenAI Provider" },
        budgetUsd: 100
      },
      anthropic: {
        usage: readFixture("fixtures/providers/anthropic/usage-normal.json"),
        costs: readFixture("fixtures/providers/anthropic/costs-normal.json"),
        account: { id: "anthropic-from-provider", displayName: "Anthropic Provider" },
        budgetUsd: 25
      }
    });
    const snapshot = buildWidgetSnapshot(accounts, { now });

    assert.equal(snapshot.recommendation.bestAccountId, "openai-from-provider");
    assert.deepEqual(snapshot.recommendation.riskyAccountIds, []);
    assert.equal(snapshot.counts.ok, 2);
    assert.equal(auditSnapshot(snapshot).ok, true);
    assert.equal(JSON.stringify(snapshot).includes("rawResponse"), false);
  });

  it("carries provider parser risk into widget recommendation", () => {
    const accounts = buildProviderFixtureAccounts({
      now,
      openai: {
        usage: readFixture("fixtures/providers/openai/usage-normal.json"),
        costs: readFixture("fixtures/providers/openai/costs-normal.json"),
        account: { id: "openai-risk-from-provider", displayName: "OpenAI Risk" },
        budgetUsd: 45
      },
      anthropic: {
        usage: readFixture("fixtures/providers/anthropic/usage-normal.json"),
        costs: readFixture("fixtures/providers/anthropic/costs-normal.json"),
        account: { id: "anthropic-ok-from-provider", displayName: "Anthropic OK" },
        budgetUsd: 100
      }
    });
    const snapshot = buildWidgetSnapshot(accounts, { now });

    assert.equal(snapshot.recommendation.bestAccountId, "anthropic-ok-from-provider");
    assert.deepEqual(snapshot.recommendation.riskyAccountIds, ["openai-risk-from-provider"]);
    assert.equal(auditSnapshot(snapshot).ok, true);
  });

  it("turns provider errors into displayable account states without raw errors", () => {
    const account = providerResultToAccount({
      ok: false,
      error: {
        code: PROVIDER_ERROR_CODE.FORBIDDEN,
        status: 403,
        retryable: false,
        message: "owner@example.com cannot read report"
      }
    }, {
      id: "anthropic-forbidden",
      provider: "anthropic",
      displayName: "Anthropic Forbidden"
    });
    const snapshot = buildWidgetSnapshot([account], { now });

    assert.equal(snapshot.counts.authFailed, 1);
    assert.deepEqual(snapshot.recommendation.authFailedAccountIds, ["anthropic-forbidden"]);
    assert.equal(JSON.stringify(snapshot).includes("owner@example.com"), false);
    assert.equal(auditSnapshot(snapshot).ok, true);
  });
});
