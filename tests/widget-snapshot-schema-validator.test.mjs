import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateWidgetSnapshotSchema } from "../src/core/widget-snapshot-schema-validator.mjs";

const snapshot = {
  schemaVersion: 1,
  generatedAt: "2026-06-18T12:00:00.000Z",
  recommendation: {
    bestAccountId: null,
    riskyAccountIds: [],
    staleAccountIds: [],
    authFailedAccountIds: []
  },
  accounts: [],
  counts: {
    total: 0,
    ok: 0,
    risky: 0,
    stale: 0,
    authFailed: 0,
    unsupported: 0,
    unknown: 0
  }
};

describe("widget snapshot schema validator", () => {
  it("passes a minimal valid snapshot", () => {
    assert.deepEqual(validateWidgetSnapshotSchema(snapshot), { ok: true, failures: [] });
  });

  it("rejects wrong schema version and unknown fields", () => {
    const audit = validateWidgetSnapshotSchema({ ...snapshot, schemaVersion: 2, extra: true });

    assert.equal(audit.ok, false);
    assert.match(audit.failures.map((failure) => `${failure.path} ${failure.reason}`).join("\n"), /schemaVersion/);
    assert.match(audit.failures.map((failure) => `${failure.path} ${failure.reason}`).join("\n"), /extra/);
  });
});
