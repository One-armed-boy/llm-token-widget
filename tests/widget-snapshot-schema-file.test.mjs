import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("widget snapshot schema file", () => {
  it("defines schemaVersion 1 and forbids unknown account fields", () => {
    const schema = JSON.parse(readFileSync("schemas/widget-snapshot.schema.json", "utf8"));

    assert.equal(schema.properties.schemaVersion.const, 1);
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.$defs.widgetAccount.additionalProperties, false);
    assert.deepEqual(schema.$defs.accountHealth.enum, ["ok", "risky", "stale", "authFailed", "unsupported", "unknown"]);
    assert.deepEqual(schema.$defs.provider.enum, ["openai", "anthropic", "manual"]);
  });
});
