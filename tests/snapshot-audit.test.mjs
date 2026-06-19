import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auditSnapshot } from "../scripts/snapshot-audit.mjs";

const validSnapshot = {
  schemaVersion: 1,
  generatedAt: "2026-06-18T12:00:00.000Z",
  recommendation: {
    bestAccountId: "openai-prod",
    riskyAccountIds: ["openai-risk"],
    staleAccountIds: [],
    authFailedAccountIds: []
  },
  accounts: [
    {
      id: "openai-prod",
      provider: "openai",
      displayName: "OpenAI Prod",
      health: "ok",
      usagePercent: 20,
      lastUpdatedAt: "2026-06-18T11:45:00.000Z",
      periodStart: "2026-06-01T00:00:00.000Z",
      periodEnd: "2026-06-30T23:59:59.000Z",
      metrics: {
        costUsd: 20,
        budgetUsd: 100,
        inputTokens: 100,
        outputTokens: 20,
        totalTokens: 120
      }
    }
  ],
  counts: {
    total: 1,
    ok: 1,
    risky: 0,
    stale: 0,
    authFailed: 0,
    unsupported: 0,
    unknown: 0
  }
};

describe("snapshot audit", () => {
  it("passes a valid widget snapshot", () => {
    assert.equal(auditSnapshot(validSnapshot).ok, true);
  });

  it("fails unknown fields", () => {
    const audit = auditSnapshot({
      ...validSnapshot,
      accounts: [{ ...validSnapshot.accounts[0], rawResponse: { any: "thing" } }]
    });

    assert.equal(audit.ok, false);
    assert.match(audit.failures.map((failure) => failure.path).join("\n"), /rawResponse/);
  });

  it("fails invalid account and metrics shapes", () => {
    const audit = auditSnapshot({
      ...validSnapshot,
      accounts: [{ ...validSnapshot.accounts[0], metrics: null }]
    });

    assert.equal(audit.ok, false);
    assert.match(audit.failures.map((failure) => failure.path).join("\n"), /metrics/);

    const missingAccounts = auditSnapshot({ ...validSnapshot, accounts: null });
    assert.equal(missingAccounts.ok, false);
    assert.match(missingAccounts.failures.map((failure) => failure.path).join("\n"), /\$\.accounts/);
  });

  it("fails schema type, enum, and required field violations", () => {
    const missingRequired = auditSnapshot({
      ...validSnapshot,
      recommendation: {
        bestAccountId: null,
        riskyAccountIds: [],
        staleAccountIds: []
      }
    });
    const invalidEnum = auditSnapshot({
      ...validSnapshot,
      accounts: [{ ...validSnapshot.accounts[0], health: "great" }]
    });
    const negativeMetric = auditSnapshot({
      ...validSnapshot,
      accounts: [{ ...validSnapshot.accounts[0], metrics: { ...validSnapshot.accounts[0].metrics, costUsd: -1 } }]
    });

    assert.equal(missingRequired.ok, false);
    assert.match(missingRequired.failures.map((failure) => failure.reason).join("\n"), /schema: is required/);
    assert.equal(invalidEnum.ok, false);
    assert.match(invalidEnum.failures.map((failure) => failure.reason).join("\n"), /schema: must be one of/);
    assert.equal(negativeMetric.ok, false);
    assert.match(negativeMetric.failures.map((failure) => failure.reason).join("\n"), /schema: must be >= 0/);
  });

  it("fails secret-looking values", () => {
    const audit = auditSnapshot({
      ...validSnapshot,
      accounts: [{ ...validSnapshot.accounts[0], displayName: ["sk", "thisShouldNeverBeInSnapshots123456"].join("-") }]
    });

    assert.equal(audit.ok, false);
    assert.match(audit.failures.map((failure) => failure.reason).join("\n"), /openai_api_key/);
  });

  it("fails email-looking values", () => {
    const audit = auditSnapshot({
      ...validSnapshot,
      accounts: [{ ...validSnapshot.accounts[0], displayName: "owner@example.com" }]
    });

    assert.equal(audit.ok, false);
    assert.match(audit.failures.map((failure) => failure.reason).join("\n"), /email/);
  });

  it("fails local paths and bearer tokens anywhere in the tree", () => {
    const audit = auditSnapshot({
      ...validSnapshot,
      recommendation: {
        ...validSnapshot.recommendation,
        riskyAccountIds: ["/home/opc/private-project"]
      },
      accounts: [{ ...validSnapshot.accounts[0], displayName: `Bearer ${"abcdefghijklmnopqrstuvwxyz123456"}` }]
    });

    assert.equal(audit.ok, false);
    const reasons = audit.failures.map((failure) => failure.reason).join("\n");
    assert.match(reasons, /linux_home_path/);
    assert.match(reasons, /bearer_token/);
  });
});
