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
      "Authorization": `Token ${bundle.dtable.access_token}`,
      "Content-Type": "application/json",
    },
    allowGetBody: true,
    body: await ctx.tableNameId(z, bundle, "search"),
  });
  const RowData = response.json["results"];

  // so muss das am Ende aussehen...
  // return [{Data: [{id:"adsfafd", name: "adfadf"},{id:"234", name: "234"}]}];

  let rows = [];
  if (RowData.length > 0) {
    for (let i = 0; i < RowData.length; i++) {
      const f = RowData[i];
      delete f._archived;
      delete f._locked_by;
      delete f._locked;
      rows.push(f);
    }
  } else if (
    RowData.length === 0 &&
    bundle.inputDataRaw._zap_search_success_on_miss
  ) {
    return [];
  } else {
    throw new z.errors.Error("Failed to find a row in SeaTable");
  }

  // transform the result and enhance
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  rows = await Promise.all(_.map(rows, async (o) => {
    const transformedObj = await ctx.mapColumnKeysAndEnhanceOutput(z, bundle, tableMetadata.columns, o);
    transformedObj.id = `${transformedObj.row_id}-${transformedObj.row_mtime}`;
    return transformedObj;
  }));

  return [{Data: rows}];
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

  key: "getmany_rows",
  noun: "Getmanyrows",

  search: {
    display: {
      label: "Find Many Rows (With Line Item Support)",
      description: "Finds multiple rows ( 10 max ).",
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

  sample: {
    "id": "N33qMZ-JQTuUlx_DiF__lQ",
    "row_id": "N33qMZ-JQTuUlx_DiF__lQ",
    "name": "Test",
  },

  outputFields: [
    {key: "id", label: "ID"},
    {key: "row_id", label: "Row ID"},
    {key: "name", label: "Name"},
  ],
};
