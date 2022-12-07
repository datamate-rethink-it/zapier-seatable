include .config/config.mk

.PHONY : all
all : lint test build
	@echo "use 'make upload' to upload."

include .config/eslint/eslint.mk
include .config/zapier/zapier.mk

## publish :  continuous deployment (cd) goal
.PHONY : publish
publish: test upload

.PHONY : upload
upload: build
	$(zapier) upload

.PHONY : test
test: lint test/.increment

.PHONY : lint
lint : src/lint.cache.increment

.PHONY : clean
clean :
	$(git) clean -fX '.config/' 'build/*.zip*' 'src' 'test'
