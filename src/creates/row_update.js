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
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

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

    // das brauche ich alles nicht mehr...
    // if (col.type === 'file') {
    //   map[col.name] = [value]
    //   continue;
    // }

    /*
    if (col.type === 'image') {
      if (value) {
        const newValue =value.split(',');
        if (newValue.length > 1) {
          map[col.name] = [...newValue];
          continue;
        }
        map[col.name] = [value];
        continue;
      } else {
        continue;
      }
    }
    */
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

    // now this must be a file or image column
    // FIXME: die table_id muss noch parametrisiert werden!

    /*
    if (!row) {
      //const tableId = sidParse(bundle.inputData.table_row).table;
      const tableId =
      //({data: row} = await zb.request(`/dtable-server/api/v1/dtables/{{dtable_uuid}}/rows/${rowId}/?table_id=${tableId}`));
      ({data: row} = await zb.request(`/dtable-server/api/v1/dtables/{{dtable_uuid}}/rows/${rowId}/?table_id=M6XY`));
    }
    */


    // z.console.log("DEBUG row", row);
    /*
    DEBUG row {
    _id: 'GDAqDco0SrqzzY6Dqa9p-Q',
    _mtime: '2023-06-19T10:22:18.374+00:00',
    _ctime: '2023-06-19T06:33:39.419+00:00',
    Name: 'Hulk der Meister 53',
    Adress: 'aeasdfadf\n\n\n',
    Number: 21,
    Percentage: 0.23,
    Collaborator: [ 'a5adebe279e04415a28b2c7e256e9e8d@auth.local' ],
    'Date of birth': '1983-08-19',
    'Beginning Time': '2021-10-13 00:00',
    Duration: 43920,
    'Single select': 'Male',
    Multiple: [ 'JavaScript,C++,Go' ],
    Email: 'asdfadf@asdfadf.de',
    URL: 'https://buzzwiz.de',
    Checkbox: true,
    Rating: 3,
    'Created time': '2023-06-19T06:33:39.419+00:00',
    'Last modifier': 'a5adebe279e04415a28b2c7e256e9e8d@auth.local',
    Modified: '2023-06-19T10:22:18.374+00:00',
    Bild: [
      'https://stage.seatable.io/workspace/224/asset/c392d08d-5b00-4456-9217-2afb89e07a0c/images/2023-06/CCLogoColorPop1.gif'
    ],
    'link to time': [ 'Pd_pHLM8SgiEcnFW5I7HLA', 'aX6jOUCyRsm0d-KPMK8L-g' ]
  }
  */
    // z.console.log("DEBUG value", value);
    /*
    DEBUG value https://zapier.com/engine/hydrate/8024503/.eJw9zkEOgyAQBdC7zFqFWrWWXU9iKE7RFIHCENMY717amG7_n7w_GyhnCS0N9PYIAm5QwGwjSatwmEcQDT_1XXfpC1ApkltSxPArel43LT8XIJVyKQtHeKrbHD5mNONg5fJFA74SRsr0c5VBRxAbpGByMxH5KBiLKEneDVazY6svj6dY8sbJMbI6s4xf_2elcdpV3upMLkiTy9OgkWDfPzdLRV0:1qBCAM:8NiiL33CeTI9I4h3iAQCX7wR54M/
    */

    // z.console.log("DEBUG col", col);
    /*
    DEBUG col {
      key: '0994',
      type: 'image',
      name: 'Bild',
      editable: true,
      width: 200,
      resizable: true,
      draggable: true,
      data: null,
      permission_type: '',
      permitted_users: [],
      edit_metadata_permission_type: '',
      edit_metadata_permitted_users: [],
      description: null
    }
    */

    // const current = row?.[col.name] || []; // warum mache ich das??

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
