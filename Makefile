.PHONY: verify docs-check test test-core test-coverage test-providers snapshot-audit e2e-mock e2e-openai e2e-anthropic e2e-openai-dry-run e2e-anthropic-dry-run ui-preview ui-screenshots

verify:
	@npm run verify

docs-check:
	@npm run docs-check

test:
	@npm test

test-core:
	@npm test

test-coverage:
	@npm run test:coverage

e2e-mock:
	@npm run e2e:mock

e2e-openai:
	@npm run e2e:openai

e2e-anthropic:
	@npm run e2e:anthropic

e2e-openai-dry-run:
	@npm run e2e:openai:dry-run

e2e-anthropic-dry-run:
	@npm run e2e:anthropic:dry-run

snapshot-audit:
	@npm run snapshot:audit

ui-preview:
	@npm run ui:preview

test-providers:
	@npm run test:providers

ui-screenshots:
	@echo "$@ is not implemented yet. See docs/12-test-harness-strategy.md."
