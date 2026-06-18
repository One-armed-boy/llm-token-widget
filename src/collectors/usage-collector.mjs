import { buildProviderRequestPlan, redactRequestPlan } from "./provider-request-plan.mjs";
import { parseAnthropicUsageFixture } from "../providers/anthropic/anthropic-usage-parser.mjs";
import { parseOpenAIUsageFixture } from "../providers/openai/openai-usage-parser.mjs";
import { providerResultToAccount } from "../providers/provider-fixture-scenario.mjs";

export async function collectAccountUsage(config, httpClient) {
  const plan = buildProviderRequestPlan(config);
  const responses = {};

  for (const request of plan.requests) {
    const response = await httpClient.request(request);
    responses[request.name] = normalizeHttpResponse(response);
  }

  const parserResult = parseProviderResponses(config, responses);
  const account = providerResultToAccount(parserResult, {
    id: config.accountId,
    provider: config.provider,
    displayName: config.displayName
  });

  return {
    ok: parserResult.ok,
    provider: config.provider,
    account,
    error: parserResult.ok ? null : parserResult.error,
    requestPlan: redactRequestPlan(plan)
  };
}

function parseProviderResponses(config, responses) {
  const common = {
    account: {
      id: config.accountId,
      displayName: config.displayName
    },
    budgetUsd: config.budgetUsd,
    now: config.now
  };

  if (config.provider === "openai") {
    return parseOpenAIUsageFixture({
      usage: responses.usage,
      costs: responses.costs,
      ...common
    });
  }

  if (config.provider === "anthropic") {
    return parseAnthropicUsageFixture({
      usage: responses.usage,
      costs: responses.costs,
      ...common
    });
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

function normalizeHttpResponse(response) {
  if (response.status >= 400) {
    return {
      error: {
        status: response.status,
        message: response.json?.error?.message ?? `HTTP ${response.status}`
      }
    };
  }

  return response.json;
}
