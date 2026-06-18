import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

describe("mock E2E script", () => {
  it("writes collector summary without raw secrets", () => {
    execFileSync("node", ["scripts/e2e-mock.mjs"], { stdio: "pipe" });
    const collectorSummaryText = readFileSync("reports/mock-e2e/collector-summary.json", "utf8");
    const collectorSummary = JSON.parse(collectorSummaryText);

    assert.equal(collectorSummary.recommendation.bestAccountId, "openai-collector-ok");
    assert.deepEqual(collectorSummary.recommendation.riskyAccountIds, ["openai-collector-risk"]);
    assert.equal(collectorSummary.counts.authFailed, 1);
    assert.equal(collectorSummary.counts.unknown, 1);
    assert.equal(collectorSummaryText.includes("openai-mock-e2e-secret"), false);
    assert.equal(collectorSummaryText.includes("anthropic-mock-e2e-secret"), false);
    assert.equal(collectorSummaryText.includes("rawResponse"), false);
    assert.equal(collectorSummary.accounts.every((account) => Array.isArray(account.requests)), true);
  });
});
