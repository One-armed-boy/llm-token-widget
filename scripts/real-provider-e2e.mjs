import { collectAccountUsage } from "../src/collectors/usage-collector.mjs";
import { createRealHttpClient } from "../src/collectors/real-http-client.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildProviderRequestPlan, redactRequestPlan } from "../src/collectors/provider-request-plan.mjs";

export async function runRealProviderE2E({ provider, env = process.env, output = console }) {
  const config = configFromEnv(provider, env);
  const client = createRealHttpClient({ timeoutMs: Number.parseInt(env.REAL_E2E_TIMEOUT_MS ?? "15000", 10) });
  const result = await collectAccountUsage(config, client);
  const reportPath = writeCompatibilityReport(provider, result, config.now);

  output.log(`${provider} real E2E ${result.ok ? "passed" : "failed"} for ${config.accountId}`);
  output.log(`${provider} compatibility report wrote ${reportPath}`);
  if (!result.ok) {
    output.error(`${provider} error: ${result.error.code}`);
    process.exitCode = 1;
  }

  return result;
}

export function buildCompatibilityReport(provider, result, generatedAt) {
  return {
    provider,
    generatedAt,
    ok: result.ok,
    account: {
      id: result.account.id,
      provider: result.account.provider,
      displayName: result.account.displayName,
      capability: result.account.capability,
      credentialStatus: result.account.credentialStatus,
      hasSnapshot: Boolean(result.account.snapshot)
    },
    metrics: result.account.snapshot?.metrics
      ? {
          costUsd: result.account.snapshot.metrics.costUsd,
          budgetUsd: result.account.snapshot.metrics.budgetUsd,
          inputTokens: result.account.snapshot.metrics.inputTokens,
          outputTokens: result.account.snapshot.metrics.outputTokens,
          totalTokens: result.account.snapshot.metrics.totalTokens
        }
      : null,
    period: result.account.snapshot
      ? {
          lastUpdatedAt: result.account.snapshot.lastUpdatedAt,
          periodStart: result.account.snapshot.periodStart,
          periodEnd: result.account.snapshot.periodEnd
        }
      : null,
    error: result.error
      ? {
          code: result.error.code,
          status: result.error.status,
          retryable: result.error.retryable,
          message: result.error.message
        }
      : null,
    requestPlan: result.requestPlan
  };
}

export function runRealProviderDryRun({ provider, env = process.env, output = console }) {
  const config = dryRunConfigFromEnv(provider, env);
  const redactedPlan = redactRequestPlan(buildProviderRequestPlan(config));
  const outputPath = join("reports", "real-e2e", `${provider}-dry-run.json`);

  writeJson(outputPath, {
    provider,
    generatedAt: config.now,
    requestPlan: redactedPlan
  });

  output.log(`${provider} dry-run wrote ${outputPath}`);
  return {
    outputPath,
    requestPlan: redactedPlan
  };
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

export function dryRunConfigFromEnv(provider, env = process.env) {
  const envWithPlaceholderSecret = {
    ...env,
    OPENAI_ADMIN_KEY: env.OPENAI_ADMIN_KEY ?? "dry-run-openai-secret",
    ANTHROPIC_ADMIN_KEY: env.ANTHROPIC_ADMIN_KEY ?? "dry-run-anthropic-secret"
  };

  if (provider === "openai") {
    return configFromEnv("openai", {
      ...envWithPlaceholderSecret,
      REAL_E2E_START_TIME: envWithPlaceholderSecret.REAL_E2E_START_TIME ?? "1780272000"
    });
  }

  if (provider === "anthropic") {
    return configFromEnv("anthropic", {
      ...envWithPlaceholderSecret,
      REAL_E2E_START_DATE: envWithPlaceholderSecret.REAL_E2E_START_DATE ?? "2026-06-01T00:00:00.000Z"
    });
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

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCompatibilityReport(provider, result, generatedAt) {
  const outputPath = join("reports", "real-e2e", `${provider}-summary.json`);
  writeJson(outputPath, buildCompatibilityReport(provider, result, generatedAt));
  return outputPath;
}
