import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const allowedRootKeys = new Set(["schemaVersion", "generatedAt", "recommendation", "accounts", "counts"]);
const allowedRecommendationKeys = new Set(["bestAccountId", "riskyAccountIds", "staleAccountIds", "authFailedAccountIds"]);
const allowedAccountKeys = new Set([
  "id",
  "provider",
  "displayName",
  "health",
  "usagePercent",
  "lastUpdatedAt",
  "periodStart",
  "periodEnd",
  "metrics"
]);
const allowedMetricsKeys = new Set(["costUsd", "budgetUsd", "inputTokens", "outputTokens", "totalTokens"]);
const allowedCountsKeys = new Set(["total", "ok", "risky", "stale", "authFailed", "unsupported", "unknown"]);

const forbiddenKeys = new Set([
  "apiKey",
  "api_key",
  "token",
  "accessToken",
  "refreshToken",
  "apiKeyId",
  "organizationId",
  "orgId",
  "email",
  "rawResponse",
  "prompt",
  "localPath",
  "repositoryPath"
]);

const forbiddenValuePatterns = [
  { name: "openai_api_key", pattern: /\bsk-[A-Za-z0-9_-]{16,}\b/ },
  { name: "bearer_token", pattern: /\bBearer\s+[A-Za-z0-9._-]{16,}\b/i },
  { name: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { name: "macos_user_path", pattern: /\/Users\/[^\s"]+/ },
  { name: "linux_home_path", pattern: /\/home\/[^\s"]+/ },
  { name: "windows_path", pattern: /[A-Za-z]:\\[^\s"]+/ }
];

export function auditSnapshot(snapshot) {
  const failures = [];

  checkAllowedKeys(snapshot, allowedRootKeys, "$", failures);
  checkAllowedKeys(snapshot.recommendation, allowedRecommendationKeys, "$.recommendation", failures);
  checkAllowedKeys(snapshot.counts, allowedCountsKeys, "$.counts", failures);

  if (!Array.isArray(snapshot.accounts)) {
    failures.push({ path: "$.accounts", reason: "accounts must be an array" });
  } else {
    snapshot.accounts.forEach((account, index) => {
      checkAllowedKeys(account, allowedAccountKeys, `$.accounts[${index}]`, failures);
      checkAllowedKeys(account.metrics, allowedMetricsKeys, `$.accounts[${index}].metrics`, failures);
    });
  }

  scanForbidden(snapshot, "$", failures);

  return {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    failures
  };
}

function checkAllowedKeys(value, allowedKeys, path, failures) {
  if (!isPlainObject(value)) {
    failures.push({ path, reason: "must be an object" });
    return;
  }

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      failures.push({ path: `${path}.${key}`, reason: "field is not in the snapshot allowlist" });
    }
  }
}

function scanForbidden(value, path, failures) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbidden(item, `${path}[${index}]`, failures));
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (forbiddenKeys.has(key)) {
        failures.push({ path: childPath, reason: "forbidden field name" });
      }
      scanForbidden(child, childPath, failures);
    }
    return;
  }

  if (typeof value === "string") {
    for (const { name, pattern } of forbiddenValuePatterns) {
      if (pattern.test(value)) {
        failures.push({ path, reason: `forbidden value pattern: ${name}` });
      }
    }
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function runCli() {
  const snapshotPath = process.argv[2] ?? "reports/mock-e2e/widget-snapshot.json";
  const outputPath = process.argv[3] ?? "reports/mock-e2e/redaction-audit.json";
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const audit = auditSnapshot(snapshot);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);

  if (!audit.ok) {
    console.error(`Snapshot audit failed. See ${outputPath}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Snapshot audit passed. Wrote ${join(outputPath)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
