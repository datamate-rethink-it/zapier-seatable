git := git
npm := npm
zapier := zapier
zip := zip
zipinfo := zipinfo

build-source-files := $(wildcard index.js src/*.js src/*/*.js)
build-test-files := $(wildcard test/*.js test/*/*.js)
build-files := $(build-source-files) $(build-test-files)
