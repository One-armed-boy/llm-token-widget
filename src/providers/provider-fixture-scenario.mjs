import { parseAnthropicUsageFixture } from "./anthropic/anthropic-usage-parser.mjs";
import { parseOpenAIUsageFixture } from "./openai/openai-usage-parser.mjs";
import { providerErrorToAccountStatus } from "./provider-adapter.mjs";

export function providerResultToAccount(result, fallbackAccount) {
  if (result.ok) {
    return result.account;
  }

  return {
    id: fallbackAccount.id,
    provider: fallbackAccount.provider,
    displayName: fallbackAccount.displayName,
    capability: providerErrorToAccountStatus(result.error) === "unsupported" ? "unsupported" : "supported",
    credentialStatus: providerErrorToAccountStatus(result.error)
  };
}

export function buildProviderFixtureAccounts({ openai, anthropic, now }) {
  const openaiResult = parseOpenAIUsageFixture({
    usage: openai.usage,
    costs: openai.costs,
    account: openai.account,
    budgetUsd: openai.budgetUsd,
    now
  });
  const anthropicResult = parseAnthropicUsageFixture({
    usage: anthropic.usage,
    costs: anthropic.costs,
    account: anthropic.account,
    budgetUsd: anthropic.budgetUsd,
    now
  });

  return [
    providerResultToAccount(openaiResult, { ...openai.account, provider: "openai" }),
    providerResultToAccount(anthropicResult, { ...anthropic.account, provider: "anthropic" })
  ];
}
