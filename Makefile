include .config/config.mk

.PHONY: all
all: test build publish

include .config/zapier/zapier.mk

## publish :  continuous deployment (cd) goal
.PHONY: publish
publish: test build
	$(zapier) upload

.PHONY: test
test: test/.increment

.PHONY: clean
clean:
	$(git) clean -fX '.config/' 'build/*.zip*'
