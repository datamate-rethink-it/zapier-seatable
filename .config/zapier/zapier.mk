
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

$(zapier-build-dir): $(zapier-build-paths)

$(zapier-build-paths) &: $(zapier-files)
	$(zapier) build
	$(zip) -qd build/source.zip \
		.config/\* .idea/\* .nvmrc Makefile \*.md test\*
	for zipfile in $(zapier-build-paths) ; do \
		zipinfo $$zipfile > $$zipfile.info ; \
	done

.PHONY: zipinfo
zipinfo: $(patsubst %,%.info,$(zapier-build-paths))

build/%.zip.info : build/%.zip
	zipinfo $< > $@
