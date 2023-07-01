const ctx = require("../ctx");
// const {sidParse} = require("../lib/sid");
const _ = require("lodash");
const {ZapBundle} = require("../ctx/ZapBundle");

/**
 * perform
 *
 * update an existing row in a table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Object>}
 */
const perform = async (z, bundle) => {
  dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  collaborators = await ctx.acquireCollaborators(z, bundle);

  const map = {};
  for (const col of ctx.getUpdateColumns(tableMetadata.columns, bundle)) {
    const key = `column:${col.key}`;
    const value = bundle.inputData?.[key];

    if ("   " === bundle.inputDataRaw?.[key]) {
      map[col.name] = "";
      continue;
    }
    if (undefined === value || "" === value) {
      continue;
    }

    if (col.type === "collaborator") {
      if (value) {
        map[col.name] = await ctx.getCollaborator(z, bundle, value);
        continue;
      } else {
        continue;
      }
    }

    // das kann an dieser stelle stehen, weil die zeile schon existiert.
    if (col.type === "link") {
      if (value) {
        await ctx.linkRecord(z, bundle, key, col);
        continue;
      }
    }

    map[col.name] = value;
  }

  // const rowId = ;
  const rowId = (ctx.sidParse(`table:${bundle.inputData.table_name}:row:${bundle.inputData.table_row}`).row)?ctx.sidParse(bundle.inputData.table_row).row:bundle.inputData.table_row;

  // file and image handling
  // let row;
  const zb = new ZapBundle(z, bundle);
  const fileUploader = zb.fileUploader();
  for (const col of ctx.getUpdateColumns(tableMetadata.columns, bundle)) {
    if (!["file", "image"].includes(col.type)) {
      continue;
    }
    const key = `column:${col.key}`;
    if ("   " === bundle.inputDataRaw?.[key]) {
      map[col.name] = [];
      continue;
    }
    const value = bundle.inputData?.[key];
    if (undefined === value || "" === value) {
      delete map[col.name];
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

  // response.data ist "{ "success": true }". Das geht noch besser. Hier will man ja wieder die werte der aktualisierten zeile haben.
  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/rows`,
    method: "PUT",
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
    body,
  });
  return response.data;
};


const inputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  return _.map(ctx.getUpdateColumns(tableMetadata.columns, bundle), (o) => {
    return {
      key: `column:${o.key}`,
      label: o.name,
      type: ctx.struct.columns.input_field_types[o.type],
      required: false,
      help_text: `${ctx.struct.columns.help_text[o.type]}`,
    };
  });
};

module.exports = {
  key: "row_update",
  noun: "Row_update",
  display: {
    label: "Update Row",
    description: "Updates an existing row, probably with input from previous steps.",
    important: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: "table_name",
        required: true,
        label: "Table",
        helpText: "Pick a SeaTable table to update a row in.",
        type: "string",
        dynamic: "get_tables_of_a_base.id.name",
        altersDynamicFields: true,
      },
      ctx.tableView,
      {
        key: "table_row",
        required: true,
        label: "Row",
        helpText: "Select provide the id of the row you want to update. You can not enter the value of the row. In this case add a search step to get the id of the row.",
        type: "string",
        dynamic: "get_row_of_a_table.id.name",
        search: "getrow.id",
        altersDynamicFields: false,
      },
      inputFields,
      // ctx.fileNoAuthLinksField,   < I don't need this here!
    ],
    sample: {"success": true},
    outputFields: [{"key": "success", "type": "boolean"}],
  },
};
