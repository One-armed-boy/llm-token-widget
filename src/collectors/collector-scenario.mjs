import { buildWidgetSnapshot } from "../core/widget-snapshot.mjs";
import { collectAccountUsage } from "./usage-collector.mjs";

export async function collectScenarioSnapshot(configs, httpClientFactory, options = {}) {
  const results = [];

  for (const config of configs) {
    const httpClient = httpClientFactory(config);
    results.push(await collectAccountUsage(config, httpClient));
  }

  const accounts = results.map((result) => result.account);
  const snapshot = buildWidgetSnapshot(accounts, { now: options.now });

  return {
    results,
    snapshot
  };
}
