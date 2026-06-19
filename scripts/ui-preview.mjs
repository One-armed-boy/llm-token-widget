import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { renderPreviewHtml } from "../src/ui-preview/render-preview-html.mjs";

const snapshotPath = resolve("fixtures/snapshots/widget-snapshot.golden.json");
const outputPath = resolve("reports/ui-preview/index.html");

const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const html = renderPreviewHtml(snapshot);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);

console.log(`Wrote ${outputPath}`);
