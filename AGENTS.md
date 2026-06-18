# AGENTS.md

## Purpose

This repository builds a lightweight macOS widget and menu bar app for checking multiple AI usage accounts at a glance.

Current product position:

- WidgetKit-first macOS app
- Multiple Claude/Codex/OpenAI/Anthropic accounts
- Official API credentials or manual budgets only
- No browser cookies, WebView login, Full Disk Access, or reuse of another app's OAuth token in the MVP
- Widget reads sanitized snapshots only

## Working Principles

- Treat the docs in `docs/` as product and architecture contracts. If behavior changes, update the relevant document in the same change.
- Keep changes small, testable, and easy for another agent to verify.
- Prefer deterministic harnesses over manual visual inspection.
- Mock data is a first-class product surface. The app must be usable and testable without real provider keys.
- The WidgetKit extension is display-only. It must not read Keychain, call provider APIs, or link provider adapters.
- Secrets never go into logs, snapshots, fixtures, screenshots, or debug artifacts.

## Baseline Documents

- Product scope: [docs/01-product-requirements.md](docs/01-product-requirements.md)
- Architecture: [docs/02-architecture.md](docs/02-architecture.md)
- Data source boundaries: [docs/03-data-sources.md](docs/03-data-sources.md)
- Data model: [docs/04-data-model.md](docs/04-data-model.md)
- Roadmap: [docs/05-roadmap.md](docs/05-roadmap.md)
- Security review: [docs/07-security-risk-review.md](docs/07-security-risk-review.md)
- Account onboarding: [docs/08-account-onboarding-flow.md](docs/08-account-onboarding-flow.md)
- Lightweight MVP validation: [docs/11-lightweight-plan-review.md](docs/11-lightweight-plan-review.md)
- Test harness strategy: [docs/12-test-harness-strategy.md](docs/12-test-harness-strategy.md)

## Standard Commands

Run these before finishing any non-trivial change:

```bash
make verify
```

As implementation lands, `make verify` must remain the single local verification entrypoint. Keep it fast enough for frequent agent use.

Planned command contract:

- `make verify`: docs checks, unit tests, provider fixture tests, mock E2E, snapshot audit
- `make test`: local Node tests now; Swift package and app tests after macOS project scaffolding
- `make test-providers`: provider parser and provider error mapping tests
- `make e2e-mock`: build/run mock account and collector flows, then generate reports
- `make snapshot-audit`: verify App Group snapshot contains only allowed fields
- `make ui-screenshots`: capture deterministic app/widget-host screenshots

## Harness Invariants

- A change is not complete if the relevant harness command cannot be named.
- UI elements that appear in tests need stable accessibility identifiers.
- Provider adapters must have fixture-based parser tests before real API E2E.
- Collector changes must have mock HTTP tests and must not write secrets or raw provider responses to reports.
- Real provider tests are opt-in only and must require explicit environment variables.
- Any debug export or artifact must be redactable and safe to inspect.

## Security Boundaries

MVP forbidden behaviors:

- Reading browser cookies or localStorage
- Built-in WebView login
- Reading another app's OAuth token
- Requesting Full Disk Access
- Automatic Claude/Codex local log scanning
- Writing raw provider responses to widget snapshots

Widget snapshot forbidden fields:

- API keys or tokens
- API key IDs in raw form
- organization IDs in raw form
- user emails
- raw provider responses
- prompts, local file paths, or repository paths

## Implementation Notes

- Use a `CredentialStore` abstraction. Keychain is the default implementation, not a global dependency.
- Use a provider-neutral `UsageSnapshot` for display and WidgetKit sharing.
- Keep provider request planning separate from parsing and snapshot writing.
- Keep recommendation logic deterministic and explainable. If data is stale or insufficient, show `unknown` rather than guessing.
- Default UI copy should say "latest snapshot" or "last updated", not "real-time".
