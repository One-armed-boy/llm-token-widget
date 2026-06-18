import {
  createProviderAccount,
  epochSecondsToIso,
  normalizeProviderError,
  numberOrNull,
  sumNumbers
} from "../provider-adapter.mjs";

export function parseOpenAIUsageFixture({ usage, costs, account, budgetUsd, now }) {
  const usageError = usage?.error;
  const costsError = costs?.error;
  if (usageError || costsError) {
    return normalizeProviderError(usageError ?? costsError);
  }

  const usageBuckets = Array.isArray(usage?.data) ? usage.data : [];
  const costBuckets = Array.isArray(costs?.data) ? costs.data : [];
  const allBuckets = [...usageBuckets, ...costBuckets];
  const periodStart = minIso(allBuckets.map((bucket) => bucket.start_time));
  const periodEnd = maxIso(allBuckets.map((bucket) => bucket.end_time));

  const metrics = {
    costUsd: parseOpenAICostUsd(costBuckets),
    budgetUsd,
    inputTokens: sumOpenAITokenField(usageBuckets, ["input_tokens", "input_audio_tokens"]),
    outputTokens: sumOpenAITokenField(usageBuckets, ["output_tokens", "output_audio_tokens"])
  };
  metrics.totalTokens = sumNumbers([metrics.inputTokens, metrics.outputTokens]);

  return {
    ok: true,
    account: createProviderAccount({
      id: account.id,
      provider: "openai",
      displayName: account.displayName,
      budgetUsd,
      snapshot: {
        lastUpdatedAt: now,
        periodStart,
        periodEnd,
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

function parseOpenAICostUsd(costBuckets) {
  return sumNumbers(
    costBuckets.flatMap((bucket) =>
      safeResults(bucket).map((result) => {
        if (result?.amount?.currency !== "usd") {
          return 0;
        }
        return numberOrNull(result.amount.value) ?? 0;
      })
    )
  );
}

function sumOpenAITokenField(usageBuckets, fieldNames) {
  return sumNumbers(
    usageBuckets.flatMap((bucket) =>
      safeResults(bucket).map((result) => sumNumbers(fieldNames.map((fieldName) => result?.[fieldName])))
    )
  );
}

function safeResults(bucket) {
  return Array.isArray(bucket?.results) ? bucket.results : [];
}

function minIso(epochSecondsValues) {
  const numeric = epochSecondsValues.filter(Number.isFinite);
  if (numeric.length === 0) {
    return null;
  }

  return epochSecondsToIso(Math.min(...numeric));
}

function maxIso(epochSecondsValues) {
  const numeric = epochSecondsValues.filter(Number.isFinite);
  if (numeric.length === 0) {
    return null;
  }

  return epochSecondsToIso(Math.max(...numeric));
}
