import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMockE2EReport, buildWidgetSnapshot } from "../src/core/widget-snapshot.mjs";

const now = "2026-06-18T12:00:00.000Z";

describe("widget snapshot", () => {
  it("builds a deterministic sanitized snapshot", () => {
    const snapshot = buildWidgetSnapshot([
      {
        id: "openai-prod",
        provider: "openai",
        displayName: "OpenAI Prod",
        capability: "supported",
        credentialStatus: "valid",
        apiKey: "must-not-be-copied",
        snapshot: {
          lastUpdatedAt: now,
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
      }
    ], { now });

    assert.equal(snapshot.schemaVersion, 1);
    assert.equal(snapshot.recommendation.bestAccountId, "openai-prod");
    assert.equal(snapshot.accounts[0].usagePercent, 20);
    assert.equal(JSON.stringify(snapshot).includes("must-not-be-copied"), false);
  });

  it("builds a compact mock E2E report", () => {
    const report = buildMockE2EReport([
      {
        id: "manual-side",
        provider: "manual",
        displayName: "Manual Budget",
        capability: "supported",
        credentialStatus: "valid",
        snapshot: {
          lastUpdatedAt: now,
          metrics: { costUsd: 12, budgetUsd: 50 }
        }
      }
    ], { now });

    assert.equal(report.bestAccountId, "manual-side");
    assert.deepEqual(report.counts, {
      total: 1,
      ok: 1,
      risky: 0,
      stale: 0,
      authFailed: 0,
      unsupported: 0,
      unknown: 0
    });
  });
});
