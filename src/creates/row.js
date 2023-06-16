const ctx = require('../ctx');
const _ = require('lodash');

const {ZapBundle} = require('../ctx/ZapBundle');

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
  let tester;

  // Enhance the columns: collaboratos and image
  for (const {key, name, type} of tableMetadata.columns) {
    if (type === 'collaborator') {
      const value =[inputData && inputData[`column:${key}`]];

      if (value) {
        map[name] = await ctx.getCollaborator(z, bundle, value[0]);
        continue;
      } else {
        continue;
      }
    }
    if (type === 'image') {
      const value =inputData && inputData[`column:${key}`];
      if (value) {
        const newValue =value.split(',');
        if (newValue.length > 1) {
          map[name] = [...newValue];
          continue;
        }
        map[name] = [inputData && inputData[`column:${key}`]];
        continue;
      } else {
        continue;
      }
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
  //const data = response.data._id;

  const {data: {_id: rowId}} = response;

  const zb = new ZapBundle(z, bundle);
  const fileUploader = zb.fileUploader();

  for (const {key, name, type} of tableMetadata.columns) {

    if (['file', 'image'].includes(type) && map?.[name]) {
      const columnAssetData = await fileUploader.uploadUrlAssetPromise(map[name], type);

      const {data} = await zb.request({
        url: `/dtable-server/api/v1/dtables/{{dtable_uuid}}/rows/`,
        method: rowId ? 'PUT' : 'POST',
        body: {
          table_name: tableMetadata.name,
          row: {[name]: [columnAssetData]},
          row_id: rowId,
        },
      });

      if (data?.success !== true) {
        throw new z.errors.HaltedError(`Failed to update uploaded ${type} ${name} column.`);
      }

      response.data[key] = [columnAssetData];
    }

    // link column
    if (type === 'link') {
      const value = inputData && inputData[`column:${key}`];
      if (value) {
        await ctx.linkCreateRecord(z, bundle, value, data);
        continue;
      }
    }
  }
  return ctx.mapCreateRowKeys(z, bundle, response.data);

  // return {data : inputData && inputData[`column:3aM5`]};
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
          //type: ['file', 'image'].includes(o.type) ? 'file' : o.type,
          type: ctx.struct.columns.input_field_types[o.type],
          required: false,
          help_text: `${ctx.struct.columns.help_text[o.type] || `[${o.type}]`} field, optional.`,
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
