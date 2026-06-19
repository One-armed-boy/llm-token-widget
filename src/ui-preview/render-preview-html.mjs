const HEALTH_META = {
  ok: { label: "OK", className: "is-ok" },
  risky: { label: "Risk", className: "is-risky" },
  stale: { label: "Stale", className: "is-stale" },
  authFailed: { label: "Auth", className: "is-auth" },
  unsupported: { label: "Manual", className: "is-unsupported" },
  unknown: { label: "Unknown", className: "is-unknown" }
};

const PROVIDER_LABEL = {
  openai: "OpenAI",
  anthropic: "Claude",
  manual: "Manual"
};

export function renderPreviewHtml(snapshot) {
  const bestAccount = snapshot.accounts.find((account) => account.id === snapshot.recommendation.bestAccountId);
  const attentionAccounts = snapshot.accounts.filter((account) => account.health !== "ok");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LLM Token Widget Preview</title>
  <style>${renderStyles()}</style>
</head>
<body>
  <main class="surface" aria-label="LLM Token Widget preview">
    <section class="widget widget-medium" aria-label="Medium widget">
      ${renderWidgetHeader(snapshot)}
      ${bestAccount ? renderBestAccount(bestAccount) : renderEmpty("No Safe Account", "All accounts need attention.")}
      <div class="attention-list">
        ${attentionAccounts.slice(0, 4).map(renderAccountRow).join("")}
      </div>
      ${renderCounts(snapshot.counts)}
    </section>
    <section class="widget widget-small" aria-label="Small widget">
      ${renderWidgetHeader(snapshot)}
      ${bestAccount ? renderBestAccount(bestAccount, { compact: true }) : renderEmpty("No Safe Account", "Check app.")}
    </section>
  </main>
</body>
</html>`;
}

function renderWidgetHeader(snapshot) {
  return `<header class="widget-header">
    <div>
      <h1>LLM Usage</h1>
      <p>${escapeHtml(formatDateTime(snapshot.generatedAt))}</p>
    </div>
    <div class="risk-count" aria-label="Risky accounts">${snapshot.counts.risky}</div>
  </header>`;
}

function renderBestAccount(account, options = {}) {
  const meta = HEALTH_META[account.health] ?? HEALTH_META.unknown;
  return `<article class="best-account ${meta.className}">
    <div class="account-title">
      <span class="provider">${escapeHtml(PROVIDER_LABEL[account.provider] ?? account.provider)}</span>
      <strong>${escapeHtml(account.displayName)}</strong>
      <span class="status">${escapeHtml(meta.label)}</span>
    </div>
    ${renderUsageBar(account)}
    ${options.compact ? "" : `<p class="supporting">Recommended for the next task</p>`}
  </article>`;
}

function renderAccountRow(account) {
  const meta = HEALTH_META[account.health] ?? HEALTH_META.unknown;
  return `<article class="account-row ${meta.className}">
    <div>
      <span class="provider">${escapeHtml(PROVIDER_LABEL[account.provider] ?? account.provider)}</span>
      <strong>${escapeHtml(account.displayName)}</strong>
    </div>
    <span class="status">${escapeHtml(meta.label)}</span>
  </article>`;
}

function renderUsageBar(account) {
  const percent = typeof account.usagePercent === "number" ? clamp(account.usagePercent, 0, 100) : null;
  const width = percent === null ? 0 : percent;
  const label = percent === null ? "n/a" : `${Math.round(percent)}%`;

  return `<div class="usage-line">
    <div class="usage-track" aria-hidden="true"><span style="width: ${width}%"></span></div>
    <span class="usage-label">${label}</span>
  </div>`;
}

function renderCounts(counts) {
  const items = [
    ["Total", counts.total],
    ["OK", counts.ok],
    ["Risk", counts.risky],
    ["Stale", counts.stale],
    ["Auth", counts.authFailed]
  ];

  return `<dl class="counts">
    ${items.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}
  </dl>`;
}

function renderEmpty(title, detail) {
  return `<article class="empty-state">
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(detail)}</span>
  </article>`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#39;";
      default: return char;
    }
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderStyles() {
  return `
:root {
  color-scheme: light dark;
  --bg: #f4f6f3;
  --panel: #ffffff;
  --ink: #1f2523;
  --muted: #66706b;
  --line: #d9dfda;
  --ok: #2f8a55;
  --risk: #b45f06;
  --stale: #246fa8;
  --auth: #c03a2b;
  --manual: #6e6f77;
  --unknown: #7a4ca0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #191c1a;
    --panel: #242925;
    --ink: #edf0ec;
    --muted: #aeb7b0;
    --line: #38413b;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font: 14px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
}

.surface {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 420px) 240px;
  gap: 24px;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.widget {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(31, 37, 35, 0.12);
  overflow: hidden;
}

.widget-medium {
  min-height: 360px;
  padding: 16px;
}

.widget-small {
  min-height: 210px;
  padding: 14px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.15;
}

p {
  margin: 0;
}

.widget-header p,
.supporting {
  color: var(--muted);
  font-size: 12px;
}

.risk-count {
  width: 34px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--risk), transparent 55%);
  color: var(--risk);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.best-account,
.account-row,
.empty-state {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--panel), var(--bg) 28%);
}

.best-account {
  padding: 12px;
}

.account-title,
.account-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.account-title strong,
.account-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0;
}

.status {
  margin-left: auto;
  font-size: 12px;
  font-weight: 800;
}

.usage-line {
  display: grid;
  grid-template-columns: 1fr 42px;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.usage-track {
  height: 8px;
  background: color-mix(in srgb, var(--line), transparent 35%);
  border-radius: 999px;
  overflow: hidden;
}

.usage-track span {
  display: block;
  height: 100%;
  background: var(--ok);
  border-radius: inherit;
}

.usage-label,
.counts dd {
  font-variant-numeric: tabular-nums;
}

.supporting {
  margin-top: 8px;
}

.attention-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.account-row {
  justify-content: space-between;
  padding: 10px;
}

.account-row > div {
  display: flex;
  gap: 8px;
  min-width: 0;
}

.counts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin: 14px 0 0;
}

.counts div {
  border-top: 1px solid var(--line);
  padding-top: 8px;
}

.counts dt {
  color: var(--muted);
  font-size: 11px;
}

.counts dd {
  margin: 0;
  font-weight: 800;
}

.empty-state {
  display: grid;
  gap: 4px;
  padding: 12px;
}

.empty-state span {
  color: var(--muted);
  font-size: 12px;
}

.is-ok .status,
.is-ok .usage-track span {
  color: var(--ok);
  background: var(--ok);
}

.is-risky .status,
.is-risky .usage-track span {
  color: var(--risk);
  background: var(--risk);
}

.is-stale .status,
.is-stale .usage-track span {
  color: var(--stale);
  background: var(--stale);
}

.is-auth .status,
.is-auth .usage-track span {
  color: var(--auth);
  background: var(--auth);
}

.is-unsupported .status,
.is-unsupported .usage-track span {
  color: var(--manual);
  background: var(--manual);
}

.is-unknown .status,
.is-unknown .usage-track span {
  color: var(--unknown);
  background: var(--unknown);
}

@media (max-width: 760px) {
  .surface {
    grid-template-columns: minmax(280px, 420px);
    align-content: start;
    padding: 18px;
  }

  .widget-small {
    width: 240px;
  }
}
`;
}
