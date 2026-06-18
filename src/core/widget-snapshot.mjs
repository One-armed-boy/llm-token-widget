import { ACCOUNT_HEALTH, summarizeAccounts } from "./usage-domain.mjs";

export function buildWidgetSnapshot(accounts, options = {}) {
  const now = options.now ?? new Date().toISOString();
  const summary = summarizeAccounts(accounts, { now });
  const summariesById = new Map(summary.accounts.map((account) => [account.accountId, account]));

  return {
    schemaVersion: 1,
    generatedAt: now,
    recommendation: {
      bestAccountId: summary.bestAccountId,
      riskyAccountIds: summary.riskyAccountIds,
      staleAccountIds: summary.staleAccountIds,
      authFailedAccountIds: summary.authFailedAccountIds
    },
    accounts: accounts.map((account) => sanitizeAccount(account, summariesById.get(account.id))),
    counts: {
      total: accounts.length,
      ok: countHealth(summary.accounts, ACCOUNT_HEALTH.OK),
      risky: countHealth(summary.accounts, ACCOUNT_HEALTH.RISKY),
      stale: countHealth(summary.accounts, ACCOUNT_HEALTH.STALE),
      authFailed: countHealth(summary.accounts, ACCOUNT_HEALTH.AUTH_FAILED),
      unsupported: countHealth(summary.accounts, ACCOUNT_HEALTH.UNSUPPORTED),
      unknown: countHealth(summary.accounts, ACCOUNT_HEALTH.UNKNOWN)
    }
  };
}

export function buildMockE2EReport(accounts, options = {}) {
  const snapshot = buildWidgetSnapshot(accounts, options);

  return {
    generatedAt: snapshot.generatedAt,
    bestAccountId: snapshot.recommendation.bestAccountId,
    counts: snapshot.counts,
    accounts: snapshot.accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      health: account.health,
      usagePercent: account.usagePercent
    }))
  };
}

function sanitizeAccount(account, summary) {
  const metrics = account.snapshot?.metrics ?? {};
  const usageRatio = summary?.usageRatio ?? null;

  return {
    id: account.id,
    provider: account.provider,
    displayName: account.displayName,
    health: summary?.health ?? ACCOUNT_HEALTH.UNKNOWN,
    usagePercent: usageRatio === null ? null : Math.round(usageRatio * 1000) / 10,
    lastUpdatedAt: account.snapshot?.lastUpdatedAt ?? null,
    periodStart: account.snapshot?.periodStart ?? null,
    periodEnd: account.snapshot?.periodEnd ?? null,
    metrics: {
      costUsd: numberOrNull(metrics.costUsd),
      budgetUsd: numberOrNull(metrics.budgetUsd),
      inputTokens: numberOrNull(metrics.inputTokens),
      outputTokens: numberOrNull(metrics.outputTokens),
      totalTokens: numberOrNull(metrics.totalTokens)
    }
  };
}

function countHealth(accounts, health) {
  return accounts.filter((account) => account.health === health).length;
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}
