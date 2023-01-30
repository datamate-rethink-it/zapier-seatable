eslint := npx eslint

eslint-deps := ./index.js ./src ./test
eslint-files := ./index.js $(wildcard ./src/*.js ./src/*/*.js) $(wildcard ./test/*.js ./test/*/*.js)
eslint-config-files := $(wildcard package*.json) node_modules/.package-lock.json \
	.config/eslint/.rc.json .config/eslint/eslint.mk

## lint-warn : show eslint warnings
.PHONY : eslint-warn
eslint-warn : $(eslint-config-files)
	$(eslint) -c .config/eslint/.rc.json $(eslint-deps)

## eslint-fix : eslint --fix the project
.PHONY : eslint-fix
eslint-fix : $(eslint-config-files)
	$(eslint) -c .config/eslint/.rc.json --fix $(eslint-deps)
	$(git) update-index --refresh
	$(git) diff-index --quiet HEAD --

## eslint-quick-fix : eslint --fix the project w/o checking for workdir modified files afterwards as `eslint-fix` does
.PHONY : eslint-quick-fix
eslint-quick-fix : build/.cache/eslint-quick-fix.sentinel

build/.cache/eslint-quick-fix.sentinel : $(eslint-config-files) $(build-files)
	$(eslint) -c .config/eslint/.rc.json --fix $(eslint-deps)
	$(mkdir) -p $(@D) && touch $@

## src/lint.cache.increment : lint increment
src/lint.cache.increment : $(eslint-config-files) $(build-files)
	$(eslint) -c .config/eslint/.rc.json --quiet $(eslint-deps)
	touch $@
