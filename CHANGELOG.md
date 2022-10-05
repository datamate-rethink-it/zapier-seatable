# Change-Log

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
