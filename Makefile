include .config/config.mk

.PHONY : all
all : lint test build
	@echo "use 'make upload' to upload."

include .config/eslint/eslint.mk
include .config/zapier/zapier.mk

## build : build artifacts
.PHONY : build
build : $(zapier-build-dir)/.increment

## publish : continuous deployment (cd) goal
.PHONY : publish
publish: test upload

## quick : push from worktree to zapier, test afterwards then
.PHONY : quick
quick : eslint-quick-fix build/.cache/quick-upload.sentinel test build

.PHONY : upload
upload: build zapier-upload

.PHONY : test
test: lint test/.increment

.PHONY : lint
lint : src/lint.cache.increment

.PHONY : clean
clean :
	rm -f node_modules/.package-lock.json
	$(git) clean -fX .config/ 'build/*.zip*' src test
