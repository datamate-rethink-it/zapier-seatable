const ctx = require("../ctx");
const _ = require("lodash");
const {ZapBundle} = require("../ctx/ZapBundle");

/**
 * perform
 *
 * creates (appends) a new row in table
 * input data is like column:8hzP: ABC, this has to be transformed to Adress: ABC and then saved to map.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Object.<string,string>>}
 */
const perform = async (z, bundle) => {
  dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  const map = {};
  const inputData = bundle.inputData;

  // z.console.log("Debug inputData", inputData);

  // Enhance the columns: collaborators
  for (const {key, name, type} of tableMetadata.columns) {
    if (type === "collaborator") {
      const value =[inputData && inputData[`column:${key}`]];
      if (value) {
        map[name] = await ctx.getCollaborator(z, bundle, value[0]);
        continue;
      } else {
        continue;
      }
    }
    map[name] = inputData && inputData[`column:${key}`];
  }

  // API-Request to create a new row! Files and links are added later.
  /** @type {DTableCreateRowResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/rows/`,
    method: "POST",
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
    body: {
      table_name: tableMetadata.name,
      row: map,
    },
  });

  const {data: {_id: rowId}} = response;
  const zb = new ZapBundle(z, bundle);
  const fileUploader = zb.fileUploader();

  // add table row to bundle, for adding links
  bundle.inputData.table_row = rowId;

  /* row existiert, jetzt wird erweitert mit links und images/files */

  // file + image upload + links
  // const fileUploader = zb.fileUploader();

  // for (const {key, name, type} of tableMetadata.columns) {
  for (const col of ctx.getUpdateColumns(tableMetadata.columns, bundle)) {
    const key = `column:${col.key}`;
    const value = bundle.inputData?.[key];

    if (undefined === value || "" === value) {
      continue;
    }
    if (col.type === "link") {
      await ctx.linkRecord(z, bundle, key, col);
      continue;
    }
    if (!["file", "image"].includes(col.type)) {
      continue;
    }

    const current = [];
    const columnAssetData = await fileUploader.uploadUrlAssetPromise(z, value, col.type);
    current.push(columnAssetData);
    map[col.name] = current;
  }

  // make the update of the row!
  const body = {
    table_name: tableMetadata.name,
    row: map,
    row_id: rowId,
  };

  // update the column
  /** @type {ZapierZRequestResponse} */
  await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/rows`,
    method: "PUT",
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
    body,
  });

  // generate output for zapier.
  return ctx.mapCreateRowKeys(z, bundle, response.data);
};

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{label: *, type: *, key: string, required: boolean, help_text: string}[]>}
 * Generate all the input fields, that can be selected!!!
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
          type: ctx.struct.columns.input_field_types[o.type],
          required: false,
          help_text: `${ctx.struct.columns.help_text[o.type]}`,
        };
      });
};

/* old, wrong
const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  return _.concat(
      {key: 'row_id', label: 'ID'},
      _.map(tableMetadata.columns, (o) => ({key: `column:${o.key}`, label: o.name})),
  );
};
*/

/* new: taken from triggers */
const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  return [
    {key: "row_id", label: "Original ID"},
    {key: "row_mtime", label: "Last modification time"},
    {key: "row_ctime", label: "Creation time"},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
  ];
};


// noinspection SpellCheckingInspection
const sample = {"column:0000": "I am new Row2445", "row_id": "AdTy5Y8-TW6MVHPXTyOeTw"};

module.exports = {
  key: "row",
  noun: "Row",
  display: {
    label: "Create Row",
    description: "Creates a new row, probably with input from previous steps.",
    important: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: "table_name",
        required: true,
        label: "Table",
        helpText: "Pick a SeaTable table to create the new Row in.",
        type: "string",
        dynamic: "get_tables_of_a_base.id.name",
        altersDynamicFields: true,
      },
      inputFields,
    ],
    sample,
    outputFields: [outputFields],
  },
};
