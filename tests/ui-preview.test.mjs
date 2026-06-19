import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { renderPreviewHtml } from "../src/ui-preview/render-preview-html.mjs";

describe("UI preview renderer", () => {
  it("renders the golden snapshot without null metrics or raw secrets", () => {
    const snapshot = JSON.parse(readFileSync("fixtures/snapshots/widget-snapshot.golden.json", "utf8"));
    const html = renderPreviewHtml(snapshot);

    assert.match(html, /OpenAI Prod/);
    assert.match(html, /Claude Auth Failed/);
    assert.match(html, /Recommended for the next task/);
    assert.equal(html.includes(">null<"), false);
    assert.equal(html.includes(`${"\""}${["sk", ""].join("-")}`), false);
    assert.equal(html.includes(["Bearer", ""].join(" ")), false);
  });

  it("escapes account display names", () => {
    const snapshot = {
      schemaVersion: 1,
      generatedAt: "2026-06-18T12:00:00.000Z",
      recommendation: {
        bestAccountId: "unsafe",
        riskyAccountIds: [],
        staleAccountIds: [],
        authFailedAccountIds: []
      },
      accounts: [
        {
          id: "unsafe",
          provider: "manual",
          displayName: "<script>alert(1)</script>",
          health: "ok",
          usagePercent: 10,
          lastUpdatedAt: null,
          periodStart: null,
          periodEnd: null,
          metrics: {
            costUsd: null,
            budgetUsd: null,
            inputTokens: null,
            outputTokens: null,
            totalTokens: null
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

    const html = renderPreviewHtml(snapshot);

    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.equal(html.includes("<script>alert(1)</script>"), false);
  });
});
