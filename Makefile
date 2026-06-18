.PHONY: verify docs-check test test-core test-providers snapshot-audit e2e-mock ui-screenshots

verify: docs-check

docs-check:
	@test -f README.md
	@test -f AGENTS.md
	@test -f docs/01-product-requirements.md
	@test -f docs/02-architecture.md
	@test -f docs/05-roadmap.md
	@test -f docs/07-security-risk-review.md
	@test -f docs/11-lightweight-plan-review.md
	@test -f docs/12-test-harness-strategy.md
	@rg -q "안전하고 가벼운 다중 계정" docs/01-product-requirements.md
	@rg -q "make verify" AGENTS.md docs/12-test-harness-strategy.md

test test-core test-providers snapshot-audit e2e-mock ui-screenshots:
	@echo "$@ is not implemented yet. See docs/12-test-harness-strategy.md."

