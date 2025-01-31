# SeaTable Zapier-Integration

`seatable`

## Actions

- **_Triggers:_**
  - New File
  - New Row
  - Updated Row
  - (internal) Tables
  - (internal) Views
- **_Creates:_**
  - Row
  - Update Row
- **_Searches:_**
  - Row
  - (internal) Row

## TODO

- [ ] Provisioning for test-data

<details>
  <summary>Done</summary>

## Done

- [DEV-1: Version 2.0.0 Release Done-Log](doc/dev-1-v2.0.0-release.md)

</details>

## QA

- [x] new_row_in_default_view (trigger) does not conform w/ data-order to "Sort reverse-chronologically by time
      created." <https://zapier.com/developer/documentation/v2/deduplication/>
      via <https://platform.zapier.com/cli_docs/docs#how-does-deduplication-work>

## Notes

1. Zapier Core 14 / Node 16
2. [`zapier` cli app][ZAPIER-CLI] required.
3. Mind the static test-data in `test` folder for testing.
4. NOTE: Using `zapier build` artifacts unchanged leaks project/company
   secrets, use the appropriate `make` goals instead.

[ZAPIER-CLI]: https://platform.zapier.com/cli_tutorials/getting-started#installing-the-cli

---

was ich geändert habe:

- in .zapierapprc aufgenommen: "includeInBuild": ["src/authenticationFunctionRequire.js"]
- ganze Makefile und linting raus... (https://eslint.org/docs/latest/use/getting-started)
- linting wird einfach so gestartet. `node_modules/.bin/eslint index.js`
- hier noch was rausziehen? https://unpkg.com/browse/zapier-platform-cli@14.0.0/package.json
  - smoke-tests?
- neuer Spaltentyp
- node_modules/.bin/eslint src/ --fix

## wie ich entwickel:
