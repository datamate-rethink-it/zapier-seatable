
# zapier build parameters
zapier-build-dir := build
zapier-build-names := $(zapier-build-dir) source
zapier-build-zips := $(patsubst %,%.zip,$(zapier-build-names))
zapier-build-paths := $(patsubst %,$(zapier-build-dir)/%,$(zapier-build-zips))

# zapier files (package, sources and tests)
zapier-package-files := $(wildcard package*.json)
zapier-source-files := $(wildcard index.js src/*.js src/*/*.js)
zapier-test-files := $(wildcard test/*.js test/*/*.js)
zapier-files := $(zapier-package-files) $(zapier-source-files) $(zapier-test-files)

package-lock.json : package.json
	$(npm) install
	$(zapier) validate

test/.increment: $(zapier-files)
	$(zapier) test
	touch $@

$(zapier-build-dir): $(zapier-build-paths)

$(zapier-build-paths) &: $(zapier-files)
	$(zapier) build
	$(zip) -ur build/build.zip src/authenticationFunctionRequire.js
	$(zip) -qd build/source.zip \
		.config/\* .idea/\* .nvmrc Makefile \*.md test\*
	$(MAKE) --no-print-directory $(zapier-build-paths:.zip=.zip.info)

build/%.zip.info : build/%.zip
	zipinfo $< > $@
