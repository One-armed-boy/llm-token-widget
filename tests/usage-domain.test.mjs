import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNT_HEALTH, accountHealth, summarizeAccounts, usageRatio } from "../src/core/usage-domain.mjs";

const now = "2026-06-18T12:00:00.000Z";

describe("usage domain", () => {
  it("calculates budget usage ratio", () => {
    assert.equal(usageRatio({ costUsd: 45, budgetUsd: 100 }), 0.45);
    assert.equal(usageRatio({ costUsd: 45 }), null);
    assert.equal(usageRatio({ costUsd: 45, budgetUsd: 0 }), null);
    assert.equal(usageRatio({ costUsd: -1, budgetUsd: 100 }), null);
  });

  it("prioritizes unsupported and auth failed states before usage risk", () => {
    const snapshot = {
      lastUpdatedAt: now,
      metrics: { costUsd: 99, budgetUsd: 100 }
    };

    assert.equal(accountHealth({ capability: "unsupported", credentialStatus: "valid", snapshot }, { now }), ACCOUNT_HEALTH.UNSUPPORTED);
    assert.equal(accountHealth({ capability: "supported", credentialStatus: "authFailed", snapshot }, { now }), ACCOUNT_HEALTH.AUTH_FAILED);
  });

  it("marks stale accounts before budget risk", () => {
    const account = {
      capability: "supported",
      credentialStatus: "valid",
      snapshot: {
        lastUpdatedAt: "2026-06-16T11:59:59.000Z",
        metrics: { costUsd: 99, budgetUsd: 100 }
      }
    };

    assert.equal(accountHealth(account, { now }), ACCOUNT_HEALTH.STALE);
  });

  it("marks risky, ok, and unknown accounts", () => {
    assert.equal(accountHealth(account("ok", "OK", "openai", 10, 100, now), { now }), ACCOUNT_HEALTH.OK);
    assert.equal(accountHealth(account("risky", "Risky", "openai", 90, 100, now), { now }), ACCOUNT_HEALTH.RISKY);
    assert.equal(accountHealth({ capability: "supported", credentialStatus: "valid" }, { now }), ACCOUNT_HEALTH.UNKNOWN);
    assert.equal(accountHealth({
      capability: "supported",
      credentialStatus: "valid",
      snapshot: { lastUpdatedAt: "not-a-date", metrics: { costUsd: 1, budgetUsd: 10 } }
    }, { now }), ACCOUNT_HEALTH.UNKNOWN);
  });

  it("summarizes risky, stale, and auth failed accounts", () => {
    const summary = summarizeAccounts([
      account("openai-prod", "OpenAI Prod", "openai", 20, 100, now),
      account("openai-risk", "OpenAI Risk", "openai", 95, 100, now),
      account("anthropic-stale", "Claude Stale", "anthropic", 10, 100, "2026-06-16T00:00:00.000Z"),
      {
        id: "anthropic-auth",
        provider: "anthropic",
        displayName: "Claude Auth",
        capability: "supported",
        credentialStatus: "authFailed"
      }
    ], { now });

    assert.equal(summary.bestAccountId, "openai-prod");
    assert.deepEqual(summary.riskyAccountIds, ["openai-risk"]);
    assert.deepEqual(summary.staleAccountIds, ["anthropic-stale"]);
    assert.deepEqual(summary.authFailedAccountIds, ["anthropic-auth"]);
  });

  it("chooses the lowest healthy usage ratio with deterministic tie breaks", () => {
    const summary = summarizeAccounts([
      account("zeta", "Zeta", "openai", 20, 100, "2026-06-18T11:40:00.000Z"),
      account("alpha", "Alpha", "openai", 20, 100, "2026-06-18T11:50:00.000Z"),
      account("manual", "Manual", "manual", 10, 100, "2026-06-18T11:00:00.000Z")
    ], { now });

    assert.equal(summary.bestAccountId, "manual");

    const tied = summarizeAccounts([
      account("zeta", "Zeta", "openai", 20, 100, "2026-06-18T11:50:00.000Z"),
      account("alpha", "Alpha", "openai", 20, 100, "2026-06-18T11:50:00.000Z")
    ], { now });

    assert.equal(tied.bestAccountId, "alpha");
  });

  it("returns no recommendation when no account is healthy", () => {
    const summary = summarizeAccounts([
      account("risk", "Risk", "openai", 99, 100, now),
      {
        id: "auth",
        provider: "anthropic",
        displayName: "Auth",
        capability: "supported",
        credentialStatus: "missing"
      }
    ], { now });

    assert.equal(summary.bestAccountId, null);
  });
});

function account(id, displayName, provider, costUsd, budgetUsd, lastUpdatedAt) {
  return {
    id,
    provider,
    displayName,
    capability: "supported",
    credentialStatus: "valid",
    snapshot: {
      lastUpdatedAt,
      metrics: { costUsd, budgetUsd }
    }
  };
}
