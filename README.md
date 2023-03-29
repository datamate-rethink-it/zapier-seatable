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

* [DEV-1: Version 2.0.0 Release Done-Log](doc/dev-1-v2.0.0-release.md)

</details>

## QA

* [x] new_row_in_default_view (trigger) does not conform w/ data-order to "Sort reverse-chronologically by time
  created." <https://zapier.com/developer/documentation/v2/deduplication/>
  via <https://platform.zapier.com/cli_docs/docs#how-does-deduplication-work>

## Notes

1. Zapier Core 14 / Node 16
2. [`zapier` cli app][ZAPIER-CLI] required.
3. Mind the static test-data in `test` folder for testing.
4. NOTE: Using `zapier build` artifacts unchanged leaks project/company
   secrets, use the appropriate `make` goals instead.

[ZAPIER-CLI]: https://platform.zapier.com/cli_tutorials/getting-started#installing-the-cli
