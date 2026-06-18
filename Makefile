.PHONY: verify docs-check test test-core test-providers snapshot-audit e2e-mock ui-screenshots

verify:
	@npm run verify

docs-check:
	@npm run docs-check

test:
	@npm test

test-core:
	@npm test

e2e-mock:
	@npm run e2e:mock

snapshot-audit:
	@npm run snapshot:audit

test-providers ui-screenshots:
	@echo "$@ is not implemented yet. See docs/12-test-harness-strategy.md."
