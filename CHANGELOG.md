# Change-Log

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
