include .config/config.mk

.PHONY: all
all: test build publish

include .config/zapier/zapier.mk

.PHONY: publish
publish: test build
	$(zapier) upload

.PHONY: test
test: $(zapier-files)
	$(zapier) test

.PHONY: clean
clean:
	$(git) clean -fX '.config/' 'build/*.zip*'
