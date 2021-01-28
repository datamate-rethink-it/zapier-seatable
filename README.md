# SeaTable Zapier-Integration

`sea-table`

## Actions

* ***Triggers:***
    * New Row
    * Updated Row
    * (internal) Tables
    * (internal) Views
* ***Creates:***
    * Row
    * Update Row
* ***Searches:***
    * Row
    * (internal) Row

## TODO

* [ ] Provisioning for test-data

<details>
  <summary>Done</summary>

## Done

* [x] ZResponse Json to Data migration (core v9 -> v10)
* [x] De-duplicate code filtering rows for searches
* [x] STZ-0018: Create: Update Row
* [x] Improve 403 error message
* [x] Hide Link-Columns from Find Row search action
* [x] Speaking labels for row_id and row_mtime special keys
* [x] Fix algorithm to obtain the linked-table-id when resolving linked rows
* [x] Make table-view an optional input
* [x] Remove New Row in Default View trigger
* [x] Fix type-error on an undefined table meta-data due to missing bundle input-data
* [x] Make Find Row input for search value dynamic
* [x] Fix auto-number for Find Row
* [x] internal: @type in ctx.js for Zapier bundle {ZapierBundle}
* [x] internal: @type {*} z.request result {ZapierZRequestResponse}
* [x] Remove sidParse v1 use, use of sid keys/ids is stable
* [x] Fix dangling column keys in search result
* [x] Support link columns with first link row-data in results (triggers, search)
* [x] Prevent search in non-filterable columns
* [x] Hide fields for writing (Image, File, Link, C/MTime, Auto-Number)
* [x] Fix help-text for fields (since 1.0.0)
* [x] Show base name when selecting a table
* [x] Correct sort for row triggers for zapier deduplication
* [x] Trigger: updated row
* [x] Search in row by column key for choices
* [x] Rename record to row
* [x] Fix search working on invalid fields (they should error) / does always find
* [x] Add dynamic input/output fields
* [x] Search or Create: Find Row in Seatable
* [x] Trigger: new row in view
* [x] Non-clashing inputData property names between table-name and column-name
* [x] Dropdown dynamic Table ID instead of Name
* [x] Streamline async/Promise use in perform
* [x] Centralize Seatable API `auth_token`
* [x] Add context (ctx)
* [x] Review more JSON encoding locations
* [x] Replace string concatenation with JSON encoding
* [x] Gate JSON responses
* [x] Add request-template
* [x] Clean code after CLI conversion
* [x] Convert to CLI

</details>

## QA

* [x] new_row_in_default_view (trigger) does not conform w/ data-order to "Sort reverse-chronologically by time
  created." <https://zapier.com/developer/documentation/v2/deduplication/>
  via <https://platform.zapier.com/cli_docs/docs#how-does-deduplication-work>

## Notes

1. Zapier Core 10 / Node 12
1. [`zapier` cli app][ZAPIER-CLI] required.
1. Mind the static test-data in `test` folder for testing.

[ZAPIER-CLI]: https://platform.zapier.com/cli_tutorials/getting-started#installing-the-cli
