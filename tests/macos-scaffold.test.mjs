import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

describe("macOS scaffold", () => {
  it("defines the app, widget, and local package targets", () => {
    const project = readFileSync("macos/project.yml", "utf8");

    assert.match(project, /LLMTokenWidgetApp:/);
    assert.match(project, /LLMTokenWidgetExtension:/);
    assert.match(project, /INFOPLIST_FILE: App\/Info\.plist/);
    assert.match(project, /UsageCore:/);
    assert.match(project, /SnapshotStore:/);
    assert.match(project, /ProviderAdapters:/);
  });

  it("keeps widget sources display-only", () => {
    const sourceText = readFiles(["macos/Widget", "macos/SharedUI"]);

    assert.equal(sourceText.includes("ProviderAdapters"), false);
    assert.equal(sourceText.includes("URLSession"), false);
    assert.equal(sourceText.includes("SecItem"), false);
    assert.equal(sourceText.includes("Keychain"), false);
  });

  it("does not give the widget network or keychain entitlements", () => {
    const widgetEntitlements = readFileSync("macos/Widget/LLMTokenWidgetExtension.entitlements", "utf8");

    assert.match(widgetEntitlements, /com\.apple\.security\.application-groups/);
    assert.equal(widgetEntitlements.includes("com.apple.security.network.client"), false);
    assert.equal(widgetEntitlements.includes("keychain-access-groups"), false);
  });

  it("keeps the Swift golden fixture in sync with the canonical fixture", () => {
    const rootFixture = readFileSync("fixtures/snapshots/widget-snapshot.golden.json", "utf8");
    const swiftFixture = readFileSync(
      "macos/Packages/UsageCore/Tests/UsageCoreTests/Resources/widget-snapshot.golden.json",
      "utf8"
    );

    assert.deepEqual(JSON.parse(swiftFixture), JSON.parse(rootFixture));
  });
});

function readFiles(paths) {
  return paths.flatMap(walkFiles).map((file) => readFileSync(file, "utf8")).join("\n");
}

function walkFiles(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    return [path];
  }

  return readdirSync(path).flatMap((entry) => walkFiles(join(path, entry)));
}
