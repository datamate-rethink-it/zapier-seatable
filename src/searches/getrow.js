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

const performSearch = async (z, bundle) => {
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-db/api/v1/query/${dtableCtx.dtable_uuid}/`,
    method: "POST",

    headers: {
      Authorization: `Token ${bundle.dtable.access_token}`,
      "Content-Type": "application/json",
    },
    // params: ctx.requestParamsSid(bundle.inputData.table_name),
    allowGetBody: true,
    body: await ctx.tableNameId(z, bundle, 'search'),
  });
  const RowData=response.json["results"];
  if(RowData.length > 0){
    return [response.json["results"][0]];
  }else{
    throw new z.errors.Error("Faild to Find a Row in Seatable");
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
        return { [`column:${o.key}`]: o.name };
      }
    )
  );
  return {
    key: "search_column",
    required: true,
    label: "Column",
    helpText: "Pick a field from the Seatable table for your search.",
    altersDynamicFields: true,
    choices,
  };
};


/**
 * Dynamic Input Field for the Search Value
 *
 * The input is yet un-typed, Zapier offers the following 'type' string values:
 *
 * 'string', 'text', 'integer', 'number', 'boolean', 'datetime', 'file', 'password', 'copy'
 *
 * The first implementation of the find operates with string inputs (un-typed or string-typed) and it is looking
 * good so far.
 *
 * SeaTable supports "date-string" for column types 'date', 'ctime' and 'mtime'. If the format is compatible
 * date-time specific inputs can be done, however with free-text input it might be that SeaTable also supports
 * relative formats which Zapier for what I know does not support. (STZ-0016)
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{helpText: string, label: string, altersDynamicFields: boolean, key: string, required: boolean}>}
 */
const searchValue = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  const colSid = ctx.sidParse(bundle.inputData.search_column);
  const col = _.find(tableMetadata.columns, ["key", colSid.column]);
  const r = {
    key: "search_value",
    required: true,
    label: "Search Value",
    helpText: "The unique value to search for in field.",
    altersDynamicFields: true,
  };
  if (col !== undefined) {
    r.helpText = `The unique value to search for in ${
      ctx.struct.columns.types[col.type] || `[${col.type}]`
    } field named "${col.name}".`;
  }
  return r;
};
module.exports = {
  key: "getrow",
  noun: "Getrow",

  search: {
    display: {
      label: "Find Row (SQL QUERY)",
      description: "Finds a Row (SQL QUERY) give.",
    },
    operation: {
      inputFields: [
        {
          key: "table_name",
          required: true,
          label: "Table",
          helpText: "Pick a SeaTable table you want to search.",
          type: "string",
          dynamic: "get_tables_of_a_base.id.name",
          altersDynamicFields: true,
        },
        searchColumn,
        searchValue,
        ctx.fileNoAuthLinksField,
      ],
      perform: performSearch,
    },
  },
  // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
  // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
  // returned records, and have obvious placeholder values that we can show to any user.
  // In this resource, the sample is reused across all methods
  sample: {
    id: 1,
    name: "Test",
  },

  // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
  // For a more complete example of using dynamic fields see
  // https://github.com/zapier/zapier-platform/tree/main/packages/cli#customdynamic-fields
  // Alternatively, a static field definition can be provided, to specify labels for the fields
  // In this resource, these output fields are reused across all resources
  outputFields: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
  ],
};
