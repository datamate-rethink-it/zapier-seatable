const ctx = require('../ctx');
const _ = require('lodash');

/**
 * perform
 *
 * creates (appends) a new row in table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Object.<string,string>>}
 */
const perform = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  const map = {};
  const inputData = bundle.inputData;

  for (const {key, name} of tableMetadata.columns) {
    if ('Collaborator' === name) {
      const value =[inputData && inputData[`column:${key}`]];
      map[name] = await ctx.getCollaborator(z,bundle,value[0]);
      continue;
    }
    map[name] = inputData && inputData[`column:${key}`];
  }

  /** @type {DTableCreateRowResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/rows/`,
    method: 'POST',
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
    body: {
      table_name: tableMetadata.name,
      row: map,
    },
  });

  return ctx.mapCreateRowKeys(response.data);
};

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{label: *, type: *, key: string, required: boolean, help_text: string}[]>}
 */
const inputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  return _.map(
      _.filter(tableMetadata.columns, (o) => {
        return !ctx.struct.columns.zapier.hide_write.includes(o.type);
      }), (o) => {
        return {
          key: `column:${o.key}`,
          label: o.name,
          type: o.type,
          required: false,
          help_text: `${ctx.struct.columns.types[o.type] || `[${o.type}]`} field, optional.`,
        };
      });
};

const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  return _.concat(
      {key: 'row_id', label: 'ID'},
      _.map(tableMetadata.columns, (o) => ({key: `column:${o.key}`, label: o.name})),
  );
};

// noinspection SpellCheckingInspection
const sample = {'column:0000': 'I am new Row2445', 'row_id': 'AdTy5Y8-TW6MVHPXTyOeTw'};

module.exports = {
  key: 'row',
  noun: 'Row',
  display: {
    label: 'Create Row',
    description: 'Creates a new row, probably with input from previous steps.',
    important: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'table_name',
        required: true,
        label: 'Table',
        helpText: 'Pick a SeaTable table to create the new Row in.',
        type: 'string',
        dynamic: 'get_tables_of_a_base.id.name',
        altersDynamicFields: true,
      },
      inputFields,
    ],
    sample,
    outputFields: [outputFields],
  },
};
