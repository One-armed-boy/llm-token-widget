import {
  createProviderAccount,
  epochSecondsToIso,
  normalizeProviderError,
  numberOrNull,
  sumNumbers
} from "../provider-adapter.mjs";

export function parseAnthropicUsageFixture({ usage, costs, account, budgetUsd, now }) {
  const usageError = usage?.error;
  const costsError = costs?.error;
  if (usageError || costsError) {
    return normalizeProviderError(usageError ?? costsError);
  }

  const usageRows = extractRows(usage);
  const costRows = extractRows(costs);
  const allRows = [...usageRows, ...costRows];
  const metrics = {
    costUsd: parseAnthropicCostUsd(costRows),
    budgetUsd,
    inputTokens: parseAnthropicInputTokens(usageRows),
    outputTokens: parseAnthropicOutputTokens(usageRows)
  };
  metrics.totalTokens = sumNumbers([metrics.inputTokens, metrics.outputTokens]);

  return {
    ok: true,
    account: createProviderAccount({
      id: account.id,
      provider: "anthropic",
      displayName: account.displayName,
      budgetUsd,
      snapshot: {
        lastUpdatedAt: now,
        periodStart: minPeriodStart(allRows),
        periodEnd: maxPeriodEnd(allRows),
        metrics
      }
    }),
    pageInfo: {
      usageHasMore: usage?.has_more === true,
      usageNextPage: typeof usage?.next_page === "string" ? usage.next_page : null,
      costsHasMore: costs?.has_more === true,
      costsNextPage: typeof costs?.next_page === "string" ? costs.next_page : null
    }
  };
}

function extractRows(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
}

function parseAnthropicInputTokens(rows) {
  return sumNumbers(rows.map((row) => {
    const inputTokens = numberOrNull(row.input_tokens) ?? numberOrNull(row.inputTokens) ?? 0;
    const cacheReadTokens = numberOrNull(row.cache_read_input_tokens) ?? numberOrNull(row.cacheReadInputTokens) ?? 0;
    const cacheCreationTokens = numberOrNull(row.cache_creation_input_tokens) ?? numberOrNull(row.cacheCreationInputTokens) ?? 0;
    return inputTokens + cacheReadTokens + cacheCreationTokens;
  }));
}

function parseAnthropicOutputTokens(rows) {
  return sumNumbers(rows.map((row) => numberOrNull(row.output_tokens) ?? numberOrNull(row.outputTokens) ?? 0));
}

function parseAnthropicCostUsd(rows) {
  return sumNumbers(rows.map((row) => {
    if (row.amount?.currency && row.amount.currency !== "usd") {
      return 0;
    }

    return (
      numberOrNull(row.amount?.value) ??
      numberOrNull(row.cost_usd) ??
      numberOrNull(row.costUsd) ??
      numberOrNull(row.amount_usd) ??
      numberOrNull(row.amountUsd) ??
      0
    );
  }));
}

function minPeriodStart(rows) {
  const starts = rows.map((row) => parsePeriodValue(row.start_time ?? row.startTime ?? row.date));
  const numeric = starts.filter(Number.isFinite);
  if (numeric.length === 0) {
    return null;
  }

  return new Date(Math.min(...numeric)).toISOString();
}

function maxPeriodEnd(rows) {
  const ends = rows.map((row) => parsePeriodValue(row.end_time ?? row.endTime ?? row.date));
  const numeric = ends.filter(Number.isFinite);
  if (numeric.length === 0) {
    return null;
  }

  return new Date(Math.max(...numeric)).toISOString();
}

function parsePeriodValue(value) {
  if (Number.isFinite(value)) {
    return value < 10_000_000_000 ? Date.parse(epochSecondsToIso(value)) : value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}
