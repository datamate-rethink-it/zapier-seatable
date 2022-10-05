# DEV-1: Version 2.0.0 Release Done-Log

The `README.md` does not scale any longer, moving the _done_ list
into DEV-1 and progress the change to the `CHANGELOG.md` format.

The Todo/Done part is merely useful for development runs
involving features of yet to understand functionality on both
SeaTable and Zapier sides.

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
