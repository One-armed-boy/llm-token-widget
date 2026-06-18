export const PROVIDER_ERROR_CODE = Object.freeze({
  AUTH_FAILED: "authFailed",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
  RATE_LIMITED: "rateLimited",
  SERVER_ERROR: "serverError",
  NETWORK_ERROR: "networkError",
  INVALID_RESPONSE: "invalidResponse",
  UNSUPPORTED: "unsupported",
  UNKNOWN: "unknown"
});

export function normalizeProviderError(errorLike) {
  const status = Number.isInteger(errorLike?.status) ? errorLike.status : null;
  const code = providerErrorCodeForStatus(status);

  return {
    ok: false,
    error: {
      code,
      status,
      retryable: isRetryableStatus(status),
      message: safeErrorMessage(errorLike?.message, code)
    }
  };
}

export function providerErrorCodeForStatus(status) {
  if (status === 401) {
    return PROVIDER_ERROR_CODE.AUTH_FAILED;
  }

  if (status === 403) {
    return PROVIDER_ERROR_CODE.FORBIDDEN;
  }

  if (status === 404) {
    return PROVIDER_ERROR_CODE.NOT_FOUND;
  }

  if (status === 429) {
    return PROVIDER_ERROR_CODE.RATE_LIMITED;
  }

  if (Number.isInteger(status) && status >= 500) {
    return PROVIDER_ERROR_CODE.SERVER_ERROR;
  }

  if (status === null) {
    return PROVIDER_ERROR_CODE.NETWORK_ERROR;
  }

  return PROVIDER_ERROR_CODE.UNKNOWN;
}

export function providerErrorToAccountStatus(providerError) {
  switch (providerError?.code) {
    case PROVIDER_ERROR_CODE.AUTH_FAILED:
    case PROVIDER_ERROR_CODE.FORBIDDEN:
      return "authFailed";
    case PROVIDER_ERROR_CODE.NOT_FOUND:
    case PROVIDER_ERROR_CODE.UNSUPPORTED:
      return "unsupported";
    default:
      return "valid";
  }
}

export function createProviderAccount({ id, provider, displayName, budgetUsd, snapshot, credentialStatus = "valid", capability = "supported" }) {
  return {
    id,
    provider,
    displayName,
    capability,
    credentialStatus,
    snapshot: snapshot
      ? {
          ...snapshot,
          metrics: {
            ...snapshot.metrics,
            budgetUsd: numberOrNull(budgetUsd) ?? numberOrNull(snapshot.metrics?.budgetUsd)
          }
        }
      : undefined
  };
}

export function epochSecondsToIso(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

export function sumNumbers(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function isRetryableStatus(status) {
  return status === null || status === 429 || (Number.isInteger(status) && status >= 500);
}

function safeErrorMessage(message, fallbackCode) {
  if (typeof message !== "string" || message.trim() === "") {
    return fallbackCode;
  }

  return message.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]");
}
