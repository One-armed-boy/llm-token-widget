import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("harness", () => {
  it("runs the Node test runner", () => {
    assert.equal(1 + 1, 2);
  });
});
