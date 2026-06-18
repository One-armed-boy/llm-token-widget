import { collectAccountUsage } from "../src/collectors/usage-collector.mjs";
import { createRealHttpClient } from "../src/collectors/real-http-client.mjs";

export async function runRealProviderE2E({ provider, env = process.env, output = console }) {
  const config = configFromEnv(provider, env);
  const client = createRealHttpClient({ timeoutMs: Number.parseInt(env.REAL_E2E_TIMEOUT_MS ?? "15000", 10) });
  const result = await collectAccountUsage(config, client);

  output.log(`${provider} real E2E ${result.ok ? "passed" : "failed"} for ${config.accountId}`);
  if (!result.ok) {
    output.error(`${provider} error: ${result.error.code}`);
    process.exitCode = 1;
  }

  return result;
}

export function configFromEnv(provider, env = process.env) {
  const now = env.REAL_E2E_NOW ?? new Date().toISOString();
  const accountId = env.REAL_E2E_ACCOUNT_ID ?? `${provider}-real`;
  const displayName = env.REAL_E2E_DISPLAY_NAME ?? `${provider} real`;
  const budgetUsd = optionalNumber(env.REAL_E2E_BUDGET_USD);

  if (provider === "openai") {
    return {
      provider,
      accountId,
      displayName,
      apiKey: requireEnv(env, "OPENAI_ADMIN_KEY"),
      budgetUsd,
      now,
      period: {
        startTime: requireUnixSecondsEnv(env, "REAL_E2E_START_TIME"),
        endTime: optionalUnixSecondsEnv(env, "REAL_E2E_END_TIME")
      }
    };
  }

  if (provider === "anthropic") {
    return {
      provider,
      accountId,
      displayName,
      apiKey: requireEnv(env, "ANTHROPIC_ADMIN_KEY"),
      budgetUsd,
      now,
      period: {
        startTime: requireEnv(env, "REAL_E2E_START_DATE"),
        endTime: env.REAL_E2E_END_DATE
      }
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

function requireEnv(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }

  return value;
}

function requireUnixSecondsEnv(env, name) {
  const value = Number.parseInt(requireEnv(env, name), 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be unix seconds`);
  }

  return value;
}

function optionalUnixSecondsEnv(env, name) {
  if (!env[name]) {
    return undefined;
  }

  const value = Number.parseInt(env[name], 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be unix seconds`);
  }

  return value;
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("REAL_E2E_BUDGET_USD must be a number");
  }

  return parsed;
}
