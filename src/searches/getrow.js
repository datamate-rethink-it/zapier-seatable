const ctx = require('../ctx');
const _ = require('lodash');

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
    method: 'POST',

    headers: {
      'Authorization': `Token ${bundle.dtable.access_token}`,
      'Content-Type': 'application/json',
    },
    // params: ctx.requestParamsSid(bundle.inputData.table_name),
    allowGetBody: true,
    body: await ctx.tableNameId(z, bundle, 'search'),
  });
  const RowData = response.json['results'];

  // row was found ...
  if (RowData.length > 0) {

    const f = response.json['results'][0];
  
    // enhance collaborators and images
    const RowMetadata = response.json['metadata'];
    for (const {key, name, type} of RowMetadata) {
      if (type === 'collaborator') {
        f[name] = await ctx.getCollaboratorData(z, bundle, f[name]);
      }
      if (type === 'image') {
        f[name] = ctx.getImageData(f[name]);
      }
    }  

    // clean up unnecessary stuff
    delete f._archived;
    delete f._locked_by;
    delete f._locked;

    return [f];

  } else if (
    RowData.length === 0 ||
    bundle.inputDataRaw._zap_search_success_on_miss
  ) {
    return [];
  } else {
    throw new z.errors.Error('Failed to find a row in SeaTable');
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
    key: 'search_column',
    required: true,
    label: 'Column',
    helpText: 'Select the column to be searched.',
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
  const col = _.find(tableMetadata.columns, ['key', colSid.column]);
  const r = {
    key: 'search_value',
    required: true,
    label: 'Search term',
    helpText: 'What to look for? *Hint:* no fuzzy search or wildcard support.',
    altersDynamicFields: true,
  };
  /* no dynamic description text.
  if (col !== undefined) {
    r.helpText = `The unique value to search for in ${
      ctx.struct.columns.types[col.type] || `[${col.type}]`
    } field named "${col.name}".`;
  }
  */
  return r;
};
const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  return [
    {key: 'row_id', label: 'ID'},
    {key: 'row_mtime', label: 'Last Modified'},
    {key: '_zap_search_was_found_status', label: 'Success?'}, // no idea, why this is not working.
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
  ];
};
module.exports = {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#searchschema
  key: 'getrow',
  noun: 'row',

  display: {
    label: 'Find Row',
    description: 'Finds a row using SQL Query search syntax. ', // Optionally, create a ${noun}, if none are found
    important: true,
  },

  operation: {
    perform,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. Searches need at least one `inputField`.
    inputFields: [
      {
        key: 'table_name',
        required: true,
        label: 'Table',
        helpText: 'Select the table you want to search in',
        type: 'string',
        dynamic: 'get_tables_of_a_base.id.name',
        altersDynamicFields: true,
      },
      searchColumn,
      searchValue,
      ctx.fileNoAuthLinksField,
    ],

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obvious placeholder values that we can show to any user.
    sample: {
      id: 1,
      name: 'Test',
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/main/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [
      outputFields,
      // these are placeholders to match the example `perform` above
      // {key: 'id', label: 'Person ID'},
      // {key: 'name', label: 'Person Name'}
    ],
  },
};
