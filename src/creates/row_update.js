const ctx = require('../ctx');
const _ = require('lodash');

/**
 * get table columns as bundled
 *
 * take view into account if available & valid
 *
 * if table or view metadata is not available for table_name / table_view (alt: default view)
 * the columns parameter falls through.
 *
 * @param {Array<DTableColumn>} columns
 * @param bundle
 * @return Array<DTableColumn>
 */
const getBundledViewColumns = (columns, bundle) => {
  const viewIsInvalid = (
    bundle.inputData.table_name &&
      bundle.inputData.table_view &&
      !bundle.inputData.table_view.startsWith(`${bundle.inputData.table_name}:`)
  );
  const tid = ctx.sidParse(bundle.inputData.table_name).table;
  /** @type DTableTable */
  const table = _.find(bundle.dtable.metadata.tables, ['_id', tid]);
  if (undefined === table) {
    return columns;
  }
  const vid = viewIsInvalid ? '0000' : ctx.sidParse(bundle.inputData.table_view).view;
  /** @type DTableView */
  const view = _.find(table.views, ['_id', vid]);
  if (undefined === view || undefined === view.hidden_columns || !_.isArray(view.hidden_columns)) {
    return columns;
  }
  return _.filter(columns, (col) => !view.hidden_columns.includes(col.key));
};

/**
 * get table columns for update
 *
 * @param {Array<DTableColumn>} columns
 * @param bundle
 * @return Array<DTableColumn>
 */
const getUpdateColumns = (columns, bundle) => {
  return _.filter(getBundledViewColumns(columns, bundle), (col) => {
    return !ctx.struct.columns.zapier.hide_write.includes(col.type);
  });
};

/**
 * perform
 *
 * update an existing row in a table
 *
 * @param z
 * @param bundle
 * @return {Promise<Object>}
 */
const perform = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  const map = {};
  for (const col of getUpdateColumns(tableMetadata.columns, bundle)) {
    const key = `column:${col.key}`;
    if ('   ' === bundle.inputDataRaw[key]) {
      map[col.name] = '';
      continue;
    }
    const value = bundle.inputData[key];
    if (undefined === value || '' === value) {
      continue;
    }
    map[col.name] = value;
  }

  let rowId;
  try {
    rowId = ctx.sidParse(bundle.inputData.table_row).row;
  } catch (e) {
    throw new z.errors.Error(`Not a valid row: "${bundle.inputData.table_row}". Please use a valid "table:...:row:..." reference.`);
  }

  const body = {
    table_name: tableMetadata.name,
    row: map,
    row_id: rowId,
  };

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/rows`,
    method: 'PUT',
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
    body,
  });

  return response.data;
};

const inputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  return _.map(getUpdateColumns(tableMetadata.columns, bundle), (o) => {
    return {
      key: `column:${o.key}`,
      label: o.name,
      type: o.type,
      required: false,
      help_text: `${ctx.struct.columns.types[o.type] || `[${o.type}]`} field, optional. To clear, enter exactly three spaces.`,
    };
  });
};

module.exports = {
  key: 'row_update',
  noun: 'Row_update',
  display: {
    label: 'Update Row',
    description: 'Updates an existing row, probably with input from previous steps.',
    important: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'table_name',
        required: true,
        label: 'Table',
        helpText: 'Pick a SeaTable table to update a row in.',
        type: 'string',
        dynamic: 'get_tables_of_a_base.id.name',
        altersDynamicFields: true,
      },
      ctx.tableView,
      {
        key: 'table_row',
        required: true,
        label: 'Row',
        helpText: 'Select row to update (by default column).',
        type: 'string',
        dynamic: 'get_row_of_a_table.id.name',
        search: 'get_row_id_of_a_table.id',
        altersDynamicFields: false,
      },
      inputFields,
    ],
    sample: {'success': true},
    outputFields: [{'key': 'success', 'type': 'boolean'}],
  },
};
