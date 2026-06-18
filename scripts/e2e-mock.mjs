import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildMockE2EReport, buildWidgetSnapshot } from "../src/core/widget-snapshot.mjs";

const fixturePath = "fixtures/scenarios/mock-accounts.json";
const outputDir = "reports/mock-e2e";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const snapshot = buildWidgetSnapshot(fixture.accounts, { now: fixture.now });
const summary = buildMockE2EReport(fixture.accounts, { now: fixture.now });

writeJson(join(outputDir, "widget-snapshot.json"), snapshot);
writeJson(join(outputDir, "summary.json"), summary);

console.log(`Wrote ${join(outputDir, "widget-snapshot.json")}`);
console.log(`Best account: ${summary.bestAccountId ?? "none"}`);

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
