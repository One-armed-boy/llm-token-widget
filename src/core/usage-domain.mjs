export const ACCOUNT_HEALTH = Object.freeze({
  OK: "ok",
  RISKY: "risky",
  STALE: "stale",
  AUTH_FAILED: "authFailed",
  UNSUPPORTED: "unsupported",
  UNKNOWN: "unknown"
});

const DEFAULT_STALE_AFTER_HOURS = 24;
const DEFAULT_RISK_THRESHOLD = 0.9;

export function usageRatio(metrics = {}) {
  const budgetUsd = numberOrNull(metrics.budgetUsd);
  const costUsd = numberOrNull(metrics.costUsd);

  if (budgetUsd === null || budgetUsd <= 0 || costUsd === null || costUsd < 0) {
    return null;
  }

  return costUsd / budgetUsd;
}

export function accountHealth(account, options = {}) {
  const now = parseDate(options.now ?? new Date());
  const staleAfterHours = options.staleAfterHours ?? DEFAULT_STALE_AFTER_HOURS;
  const riskThreshold = options.riskThreshold ?? DEFAULT_RISK_THRESHOLD;

  if (account.capability === "unsupported") {
    return ACCOUNT_HEALTH.UNSUPPORTED;
  }

  if (account.credentialStatus === "authFailed" || account.credentialStatus === "missing") {
    return ACCOUNT_HEALTH.AUTH_FAILED;
  }

  if (!account.snapshot) {
    return ACCOUNT_HEALTH.UNKNOWN;
  }

  const lastUpdatedAt = parseDate(account.snapshot.lastUpdatedAt);
  if (!lastUpdatedAt) {
    return ACCOUNT_HEALTH.UNKNOWN;
  }

  const ageHours = (now.getTime() - lastUpdatedAt.getTime()) / 3_600_000;
  if (ageHours > staleAfterHours) {
    return ACCOUNT_HEALTH.STALE;
  }

  const ratio = usageRatio(account.snapshot.metrics);
  if (ratio !== null && ratio >= riskThreshold) {
    return ACCOUNT_HEALTH.RISKY;
  }

  return ACCOUNT_HEALTH.OK;
}

export function summarizeAccounts(accounts, options = {}) {
  const summaries = accounts.map((account) => {
    const health = accountHealth(account, options);
    return {
      accountId: account.id,
      provider: account.provider,
      displayName: account.displayName,
      health,
      usageRatio: usageRatio(account.snapshot?.metrics),
      lastUpdatedAt: account.snapshot?.lastUpdatedAt ?? null
    };
  });

  return {
    accounts: summaries,
    bestAccountId: chooseBestAccountId(summaries),
    riskyAccountIds: summaries
      .filter((summary) => summary.health === ACCOUNT_HEALTH.RISKY)
      .map((summary) => summary.accountId),
    staleAccountIds: summaries
      .filter((summary) => summary.health === ACCOUNT_HEALTH.STALE)
      .map((summary) => summary.accountId),
    authFailedAccountIds: summaries
      .filter((summary) => summary.health === ACCOUNT_HEALTH.AUTH_FAILED)
      .map((summary) => summary.accountId)
  };
}

function chooseBestAccountId(summaries) {
  const eligible = summaries.filter((summary) => summary.health === ACCOUNT_HEALTH.OK);
  if (eligible.length === 0) {
    return null;
  }

  return eligible
    .toSorted((left, right) => {
      const leftRatio = left.usageRatio ?? Number.POSITIVE_INFINITY;
      const rightRatio = right.usageRatio ?? Number.POSITIVE_INFINITY;
      if (leftRatio !== rightRatio) {
        return leftRatio - rightRatio;
      }

      const leftUpdated = timestampOrZero(left.lastUpdatedAt);
      const rightUpdated = timestampOrZero(right.lastUpdatedAt);
      if (leftUpdated !== rightUpdated) {
        return rightUpdated - leftUpdated;
      }

      return left.accountId.localeCompare(right.accountId);
    })[0].accountId;
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function timestampOrZero(value) {
  const date = parseDate(value);
  return date ? date.getTime() : 0;
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
