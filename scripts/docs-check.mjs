import { readFileSync, statSync } from "node:fs";

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "docs/01-product-requirements.md",
  "docs/02-architecture.md",
  "docs/05-roadmap.md",
  "docs/07-security-risk-review.md",
  "docs/11-lightweight-plan-review.md",
  "docs/12-test-harness-strategy.md",
  "docs/13-current-env-coverage-research.md",
  "docs/14-swift-widget-contract.md",
  "schemas/widget-snapshot.schema.json",
  "fixtures/snapshots/widget-snapshot.golden.json"
];

for (const file of requiredFiles) {
  statSync(file);
}

const productRequirements = readFileSync("docs/01-product-requirements.md", "utf8");
if (!productRequirements.includes("안전하고 가벼운 다중 계정")) {
  throw new Error("Product requirements must keep the lightweight multi-account positioning.");
}

const agentGuide = readFileSync("AGENTS.md", "utf8");
const harnessStrategy = readFileSync("docs/12-test-harness-strategy.md", "utf8");
if (!agentGuide.includes("make verify") || !harnessStrategy.includes("make verify")) {
  throw new Error("AGENTS.md and test harness strategy must document make verify.");
}

const swiftContract = readFileSync("docs/14-swift-widget-contract.md", "utf8");
if (!swiftContract.includes("schemaVersion = 1") || !swiftContract.includes("Schema Evolution")) {
  throw new Error("Swift widget contract must document schema evolution rules.");
}
