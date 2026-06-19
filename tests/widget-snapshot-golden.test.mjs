import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildWidgetSnapshot } from "../src/core/widget-snapshot.mjs";
import { auditSnapshot } from "../scripts/snapshot-audit.mjs";

describe("widget snapshot golden fixture", () => {
  it("matches the canonical mock scenario exactly", () => {
    const scenario = JSON.parse(readFileSync("fixtures/scenarios/mock-accounts.json", "utf8"));
    const actual = `${JSON.stringify(buildWidgetSnapshot(scenario.accounts, { now: scenario.now }), null, 2)}\n`;
    const expected = readFileSync("fixtures/snapshots/widget-snapshot.golden.json", "utf8");

    assert.equal(actual, expected);
  });

  it("passes schema and redaction audit", () => {
    const golden = JSON.parse(readFileSync("fixtures/snapshots/widget-snapshot.golden.json", "utf8"));
    const audit = auditSnapshot(golden);

    assert.equal(audit.ok, true);
  });
});
