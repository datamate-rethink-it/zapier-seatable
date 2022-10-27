include .config/config.mk

.PHONY: all
all: test build publish

include .config/zapier/zapier.mk

## publish :  continuous deployment (cd) goal
.PHONY: publish
publish: test upload

.PHONY: upload
upload: build
	$(zapier) upload

.PHONY: test
test: test/.increment

.PHONY: clean
clean:
	$(git) clean -fX '.config/' 'build/*.zip*' 'src' 'test'
