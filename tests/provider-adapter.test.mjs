import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PROVIDER_ERROR_CODE,
  createProviderAccount,
  epochSecondsToIso,
  normalizeProviderError,
  providerErrorCodeForStatus,
  providerErrorToAccountStatus,
  sumNumbers
} from "../src/providers/provider-adapter.mjs";

describe("provider adapter contract", () => {
  it("maps common HTTP statuses to stable provider error codes", () => {
    assert.equal(providerErrorCodeForStatus(401), PROVIDER_ERROR_CODE.AUTH_FAILED);
    assert.equal(providerErrorCodeForStatus(403), PROVIDER_ERROR_CODE.FORBIDDEN);
    assert.equal(providerErrorCodeForStatus(404), PROVIDER_ERROR_CODE.NOT_FOUND);
    assert.equal(providerErrorCodeForStatus(429), PROVIDER_ERROR_CODE.RATE_LIMITED);
    assert.equal(providerErrorCodeForStatus(500), PROVIDER_ERROR_CODE.SERVER_ERROR);
    assert.equal(providerErrorCodeForStatus(null), PROVIDER_ERROR_CODE.NETWORK_ERROR);
    assert.equal(providerErrorCodeForStatus(418), PROVIDER_ERROR_CODE.UNKNOWN);
  });

  it("normalizes retryable provider errors without leaking email values", () => {
    const error = normalizeProviderError({ status: 429, message: "quota hit for owner@example.com" });

    assert.deepEqual(error, {
      ok: false,
      error: {
        code: PROVIDER_ERROR_CODE.RATE_LIMITED,
        status: 429,
        retryable: true,
        message: "quota hit for [redacted-email]"
      }
    });
  });

  it("maps provider errors to account credential states", () => {
    assert.equal(providerErrorToAccountStatus({ code: PROVIDER_ERROR_CODE.AUTH_FAILED }), "authFailed");
    assert.equal(providerErrorToAccountStatus({ code: PROVIDER_ERROR_CODE.FORBIDDEN }), "authFailed");
    assert.equal(providerErrorToAccountStatus({ code: PROVIDER_ERROR_CODE.NOT_FOUND }), "unsupported");
    assert.equal(providerErrorToAccountStatus({ code: PROVIDER_ERROR_CODE.RATE_LIMITED }), "valid");
  });

  it("creates provider accounts with normalized budget values", () => {
    const account = createProviderAccount({
      id: "openai-prod",
      provider: "openai",
      displayName: "OpenAI Prod",
      budgetUsd: 200,
      snapshot: {
        lastUpdatedAt: "2026-06-18T12:00:00.000Z",
        metrics: { costUsd: 20 }
      }
    });

    assert.equal(account.snapshot.metrics.budgetUsd, 200);
  });

  it("provides small numeric helpers for provider parsers", () => {
    assert.equal(epochSecondsToIso(1781784000), "2026-06-18T12:00:00.000Z");
    assert.equal(epochSecondsToIso("not-number"), null);
    assert.equal(sumNumbers([1, null, Number.NaN, 2]), 3);
  });
});
