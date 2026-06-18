.PHONY: verify docs-check test test-core test-providers snapshot-audit e2e-mock ui-screenshots

verify:
	@npm run verify

docs-check:
	@npm run docs-check

test test-core test-providers snapshot-audit e2e-mock ui-screenshots:
	@echo "$@ is not implemented yet. See docs/12-test-harness-strategy.md."
