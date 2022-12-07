eslint := npx eslint

eslint-deps := ./index.js ./src ./test
eslint-config-files := $(wildcard package*.json) \
	.config/eslint/.rc.json .config/eslint/eslint.mk

## lint-warn : show eslint warnings
.PHONY : eslint-warn
eslint-warn :
	$(eslint) -c .config/eslint/.rc.json $(eslint-deps)

## fix : eslint --fix the project
.PHONY : eslint-fix
eslint-fix :
	$(eslint) -c .config/eslint/.rc.json --fix $(eslint-deps)
	$(git) update-index --refresh
	$(git) diff-index --quiet HEAD --

## src/lint.cache.increment : lint increment
src/lint.cache.increment : $(eslint-config-files) $(build-files)
	$(eslint) -c .config/eslint/.rc.json --quiet $(eslint-deps)
	touch $@
