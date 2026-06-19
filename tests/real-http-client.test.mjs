import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRealHttpClient } from "../src/collectors/real-http-client.mjs";
import { collectAccountUsage } from "../src/collectors/usage-collector.mjs";
import { PROVIDER_ERROR_CODE } from "../src/providers/provider-adapter.mjs";
import { readFixture } from "./support/fixtures.mjs";

describe("real HTTP client", () => {
  it("uses fetch and redacts captured request headers", async () => {
    const authorization = ["Bearer", "openai-real-secret"].join(" ");
    const client = createRealHttpClient({
      fetchImpl: async () => response(200, readFixture("fixtures/providers/openai/usage-empty.json"))
    });
    const result = await client.request({
      name: "usage",
      method: "GET",
      url: "https://api.openai.com/v1/organization/usage/completions",
      headers: { Authorization: authorization }
    });

    assert.equal(result.status, 200);
    assert.equal(client.calls[0].redactedHeaders.Authorization, "[redacted]");
    assert.equal(JSON.stringify(client.calls).includes("openai-real-secret"), false);
  });

  it("normalizes invalid JSON without preserving raw response text", async () => {
    const client = createRealHttpClient({
      fetchImpl: async () => ({
        ok: false,
        status: 502,
        async json() {
          throw new Error("not json");
        }
      })
    });
    const result = await client.request({
      name: "usage",
      method: "GET",
      url: "https://api.openai.com/v1/organization/usage/completions",
      headers: {}
    });

    assert.deepEqual(result, {
      status: 502,
      json: {
        error: {
          status: 502,
          message: "HTTP 502"
        }
      }
    });
  });

  it("lets the collector map network errors into retryable provider errors", async () => {
    const client = createRealHttpClient({
      fetchImpl: async () => {
        throw new Error("connection reset with secret openai-should-not-appear");
      }
    });
    const result = await collectAccountUsage({
      provider: "openai",
      accountId: "openai-network",
      displayName: "OpenAI Network",
      apiKey: "openai-real-secret",
      budgetUsd: 100,
      now: "2026-06-18T12:00:00.000Z",
      period: { startTime: 1780272000, endTime: 1782950400 }
    }, client);

    assert.equal(result.ok, false);
    assert.equal(result.error.code, PROVIDER_ERROR_CODE.NETWORK_ERROR);
    assert.equal(result.error.retryable, true);
    assert.equal(JSON.stringify(result).includes("openai-real-secret"), false);
    assert.equal(JSON.stringify(result).includes("openai-should-not-appear"), false);
  });
});

function response(status, json) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return json;
    }
  };
}
