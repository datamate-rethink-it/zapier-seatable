# Change-Log

## [3.0.x]

* Collaborator support
* New File/Image column support for Row and Update Row Creates

### Added

* New File Trigger

## [2.1.14] - unreleased

### Fixed

* Showing the `link-formula`, `creator`, `last-modifier` and `button` columns in Create Row and Update Row action

### Internal

* Complete columns in struct
* Improve column type fixture; SeaTable 3.5.10
* Add link-formula and button type to struct
* CI/CD workflow first remote bindings on Microsoft Github
* Stabilize tests; SeaTable 3.5.10
* Rename npm package to `seatable`
* Improve test and build

## [2.1.13] - 2023-03-27

### Changed

* Show the SeaTable REST API response error message with unexpected HTTP errors if available (e.g. status 413)

### Internal

* Upgrade to Zapier Core 14.0.0
* Stabilize tests; SeaTable 3.4.8
* Stale Read-Me

## [2.1.12] - 2023-02-08

### Fixed

* read_poll failure: delay positive integer

### Internal

* Upgrade to Zapier Core 13.0.0

## [2.1.11] - 2023-01-30

### Internal

* Upgrade to Zapier Core 12.2.1
* Npm v7+ modules hidden file support
* Establish library
* Update schema
* CS-fixes; updated eslint rules
* Fast turn-around for development builds
* Stabilize tests; SeaTable 3.3.7
* Fix build goal, now phony and depending on the increment

## [2.1.10] - 2022-12-07

### Fixed

* Create and update row not writing to a column named "`size`" (since
  2.0.0).

### Internal

* Upgrade to Zapier Core 12.2.0
* Fix Node and Npm versions in package.json.

## [2.1.9] - 2022-12-07 (yanked)

## [2.1.8] - 2022-10-27

### Fixed

* Authenticating a Server Address with the common trailing slash
  mandated by the Uniform Resource Locator (URL) specification does not
  crumble the Zap for no obvious reason any longer (Thanks Georg).

### Internal

* Add `server_address` to the bundled `dtable`.
* Correct index names.
* Add stress and load test-suite for the SeaTable REST API.
* Leaning a first coding standard baseline towards a-z.

## [2.1.7] - 2022-10-11

### Added

* Zapier's authentication test HTTP request is now aware of the endpoint
  path using the 403 and 404 responses of 2.1.5 / DEV-2.

### Changed

* Improve connection label.

### Internal

* `authentication.test` is now a `/FunctionRequireSchema`
* Upgrade to Zapier Core 12.1.0
* Fix locked-out build.

## [2.1.5] - 2022-10-05

### Added

* DEV-2: Authentication against Invalid DTable gives 404

### Changed

* Handle 403 and 404 responses of `ctx.acquireDtableAppAccess()` in `afterResponse`.

### Internal

* Improve tests.
* Improve HTTP Status Code logging.
* Make as build manager.

## [2.1.3] - 2021-09-14

### Changed

* Add `serverInfo` object to bundle.
* Add HTTP 429 status `ThrottledError()` handling.
* Improved 403 `Error()` message.
* Improved logging in `ctx.acquireLinkColumnsData()`
* Add feature to limit time in `row_update` trigger for debugging and testing.
* Handle 429 responses in `ctx.acquireFileNoAuthLinks()`.

### Internal

* Have `format`-`STRINGS` closure in `src/const` module.
* Add `handleUndefinedJson` middleware flag `skipHandleUndefinedJson` (optional, boolean) to short-circuit global handling.
* Have `STRINGS` in `src/const` module.
* Group code in `src`.
* Add `handleHTTPError` middleware flag `skipHandleHTTPError` (optional, boolean) to short-circuit global handling.
* Upgrade to Zapier Core 12.0.3

## [2.1.1] - 2021-04-12

### Fixed

* Fix [Zapier Issue-1]: Prevent timeouts when setting up a Zap by reducing the number of rows to fetch to three (reduces the number of linked rows and subsequent HTTP API requests).
* Fix [Zapier Issue-1] (2): Prevent timeouts when fetching rows by reducing the number of rows to not fetch a linked row more than once.

[Zapier Issue-1]: https://developer.zapier.com/app/111331/issues/1

### Internal

* Upgrade to Zapier Core 12.0.2

## [2.1.0] - 2021-04-22

### Added

* `FEATURE_NO_AUTH_ASSET_LINKS` Option to add additional fields with asset-URLs (file and image columns) that are
  temporary for a couple of hours and do not require authentication.

## [2.0.0] - 2021-01-28

### New Actions

* New Row Trigger in any View (not only default View)
* Updated Row Trigger
* Row Search
* Update Row Create

### Changed

* Table View support
* Dynamized all input and output fields
* Stabilized Table/Column references - Renaming Tables/Columns does not break configured Zaps

### Fixed

* Use JSON encoding instead of string concatenation
* Conflicting field keys between tables and columns

### Internal

* Upgrade to Zapier Core 10.1.2
* Add request template
* Introduced Context (ctx) to share data and functionality between actions
* Port to CLI version

## [1.0.0]

> **Note:** This initial release was not tracked in a Change-Log
