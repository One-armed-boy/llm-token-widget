import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildWidgetSnapshot } from "../src/core/widget-snapshot.mjs";
import { auditSnapshot } from "../scripts/snapshot-audit.mjs";

describe("mock fixture contract", () => {
  it("generates the expected widget summary from the canonical scenario", () => {
    const fixture = JSON.parse(readFileSync("fixtures/scenarios/mock-accounts.json", "utf8"));
    const snapshot = buildWidgetSnapshot(fixture.accounts, { now: fixture.now });

    assert.equal(snapshot.recommendation.bestAccountId, "openai-prod");
    assert.deepEqual(snapshot.recommendation.riskyAccountIds, ["openai-risk"]);
    assert.deepEqual(snapshot.recommendation.staleAccountIds, ["anthropic-stale"]);
    assert.deepEqual(snapshot.recommendation.authFailedAccountIds, ["anthropic-auth"]);
    assert.deepEqual(snapshot.counts, {
      total: 6,
      ok: 2,
      risky: 1,
      stale: 1,
      authFailed: 1,
      unsupported: 1,
      unknown: 0
    });
    assert.equal(auditSnapshot(snapshot).ok, true);
  });
});
