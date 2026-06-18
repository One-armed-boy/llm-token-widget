.PHONY: verify docs-check test test-core test-coverage test-providers snapshot-audit e2e-mock e2e-openai e2e-anthropic ui-screenshots

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

snapshot-audit:
	@npm run snapshot:audit

test-providers:
	@npm run test:providers

ui-screenshots:
	@echo "$@ is not implemented yet. See docs/12-test-harness-strategy.md."
