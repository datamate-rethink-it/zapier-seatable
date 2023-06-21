const ctx = require("../ctx");
const _ = require("lodash");

/**
 * perform
 *
 * finds a particular row by column and value in table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */

const perform = async (z, bundle) => {
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-db/api/v1/query/${dtableCtx.dtable_uuid}/`,
    method: "POST",
    headers: {
      "Authorization": `Token ${bundle.dtable.access_token}`,
      "Content-Type": "application/json",
    },
    allowGetBody: true,
    body: await ctx.tableNameId(z, bundle, "search"),
  });
  const RowData = response.json["results"];

  // row was found ...
  if (RowData.length > 0) {
    const f = RowData[0];

    // clean up unnecessary stuff
    delete f._archived;
    delete f._locked_by;
    delete f._locked;

    let rows = [];
    rows.push(f);

    // transform the result and enhance
    const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
    rows = await Promise.all(_.map(rows, async (o) => {
      const transformedObj = await ctx.mapColumnKeysAndEnhanceOutput(z, bundle, tableMetadata.columns, o);
      transformedObj.id = `${transformedObj.row_id}-${transformedObj.row_mtime}`;
      return transformedObj;
    }));

    return rows;
  } else if (
    RowData.length === 0 ||
    bundle.inputDataRaw._zap_search_success_on_miss
  ) {
    return [];
  } else {
    throw new z.errors.Error("Failed to find a row in SeaTable");
  }
};

const searchColumn = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  const choices = _.merge(
      ..._.map(
          _.filter(tableMetadata.columns, (o) => {
            return (
              !ctx.struct.columns.filter.not.includes(o.type) &&
          !ctx.struct.columns.zapier.hide_search.includes(o.type)
            );
          }),
          (o) => {
            return {[`column:${o.key}`]: o.name};
          },
      ),
  );
  return {
    key: "search_column",
    required: true,
    label: "Column",
    helpText: "Select the column to be searched.",
    altersDynamicFields: true,
    choices,
  };
};

/**
 * Dynamic Input Field for the Search Value
 */
const searchValue = {
  key: "search_value",
  required: true,
  label: "Search term",
  helpText: "What to look for? *Hint:* no fuzzy search or wildcard support.",
  altersDynamicFields: true,
};

const searchWildcards = {
  key: "search_wildcards",
  required: false,
  default: "False",
  type: "boolean",
  label: "Activate wildcards",
  helpText:
    "**False:** The search only results perfect matches. **True:** Finds a row even if the search value is part of a string.",
  altersDynamicFields: false,
};

const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  return [
    {key: "row_id", label: "ID"},
    {key: "row_mtime", label: "Last Modified"},
    {key: "_zap_search_was_found_status", label: "Success?"}, // no idea, why this is not working.
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
  ];
};
module.exports = {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#searchschema
  key: "getrow",
  noun: "row",
  display: {
    label: "Find Row",
    description: "Finds a row using SQL Query search syntax. ", // Optionally, create a ${noun}, if none are found
    important: true,
  },

  operation: {
    perform,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. Searches need at least one `inputField`.
    inputFields: [
      {
        key: "table_name",
        required: true,
        label: "Table",
        helpText: "Select the table you want to search in",
        type: "string",
        dynamic: "get_tables_of_a_base.id.name",
        altersDynamicFields: true,
      },
      searchColumn,
      searchValue,
      searchWildcards,
      ctx.fileNoAuthLinksField,
    ],

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obvious placeholder values that we can show to any user.
    sample: {
      id: "adf1",
      name: "Test",
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/main/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [outputFields],
  },
};
