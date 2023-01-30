
# zapier build parameters
zapier-build-dir := build
zapier-build-names := $(zapier-build-dir) source
zapier-build-zips := $(patsubst %,%.zip,$(zapier-build-names))
zapier-build-paths := $(patsubst %,$(zapier-build-dir)/%,$(zapier-build-zips))

# zapier files (package, sources and tests)
zapier-package-files := $(wildcard package*.json)
zapier-files := $(zapier-package-files) $(build-files)

$(zapier-build-dir)/.increment : node_modules/.package-lock.json src/lint.cache.increment test/.increment $(zapier-files)
	$(zapier) build
	$(zip) -ur build/build.zip src/authenticationFunctionRequire.js
	$(zip) -qd build/source.zip \
		.config/\* .idea/\* .nvmrc Makefile \*.md doc\* src/schema.js test\*
	$(foreach zip,$(zapier-build-paths),zipinfo $(zip) > $(zip).info;)
	touch $@

build/.cache/zapier-upload.sentinel : $(zapier-build-paths)
	$(zapier) upload
	$(mkdir) -p $(@D) && touch $@

# sentinel of node_modules folder npm v7+
node_modules/.package-lock.json : package-lock.json
	if [ ! -s "$@" ] || [ "$$(stat -c %Y $@)" -lt "$$(stat -c %Y $<)" ]; then $(npm) install; fi
	touch --no-create --reference $< $@

package-lock.json : package.json
	$(npm) install
	$(zapier) validate

test/.increment : $(zapier-files)
	$(zapier) test
	touch $@

## zapier-build : build the zip files
.PHONY : zapier-build
zapier-build : $(zapier-build-paths)

## zapier-push : alias of zapier-upload
.PHONY : zapier-push
zapier-push : zapier-upload

## zapier-re-upload : re-upload the zip files (don't build zips)
.PHONY : zapier-re-upload
zapier-re-upload :
	$(zapier) upload

## zapier-upload : upload the zip files
.PHONY : zapier-upload
zapier-upload : build/.cache/zapier-upload.sentinel
