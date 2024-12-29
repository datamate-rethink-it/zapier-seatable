const { enrichColumns } = require("../utils");

const perform = async (z, bundle) => {
  // TODO: handle single-select, multiple-select, collaborator, images, urls, ...
  const requestOptions = {
    method: "POST",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    body: {
      table_id: bundle.inputData.table_id,
      rows: [bundle.inputData],
    },
  };
  console.log(requestOptions);
  const response = await z.request(requestOptions);
  return response.data;
};

const addDynamicOutputFields = async (z, bundle) => {
  // API call to fetch dynamic fields
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const targetTable = response.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const dynamicColumnFields = targetTable.columns.map((column) => ({
    key: column.key,
    label: column.name,
  }));

  // Return the static fields along with the dynamic ones
  const generatedOutputFields = [
    { key: "_id", label: "Row ID", type: "string" },
    { key: "_mtime", label: "Last Modified Time" },
    { key: "_ctime", label: "Creation Time" },
    { key: "_creator", label: "Creator" },
    { key: "_last_modifier", label: "Last Modifier" },
    ...dynamicColumnFields,
  ];

  //console.log(generatedOutputFields);
  return generatedOutputFields;
};

const inputFields = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const targetTable = response.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  // TODO: clean non-writable columns like button, _creator, _last_modifier, ???
  //console.log(response);

  const inputs = targetTable.columns.map((column) => ({
    key: column.name,
    label: column.name,
    type: column.type,
    required: false,
  }));
  return inputs;
};

module.exports = {
  key: "row",
  noun: "row",

  display: {
    label: "Create Row",
    description: "Creates a new row, probably with input from previous steps.",
  },

  operation: {
    perform,

    inputFields: [
      {
        key: "table_id",
        label: "Table",
        type: "string",
        required: true,
        dynamic: "intern_tables.id.name",
        altersDynamicFields: true,
        helpText: "Pick a SeaTable table to create the new Row in.",
      },
      inputFields,
    ],

    sample: {
      _ctime: "2024-12-29T15:33:30+01:00",
      _mtime: "2024-12-29T17:25:34+01:00",
      _id: "c1kYssFbSWWX5KT6yukooQ",
      id: "c1kYssFbSWWX5KT6yukooQ_2024-12-29T17:25:34+01:00",
    },

    outputFields: [addDynamicOutputFields],
  },
};
