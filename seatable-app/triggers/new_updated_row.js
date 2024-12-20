const perform = async (z, bundle) => {
  const requestOptions = {
    method: "GET",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.inputData.base_uuid}/rows/`,
    params: {
      table_id: bundle.inputData.table_id,
      view_id: bundle.inputData.view_id,
    },
  };
  const response = await z.request(requestOptions);

  /*
  const response2 = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.inputData.base_uuid}/metadata/`,
  });
  console.log(response2);

  const targetTable = response2.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const dynamicColumnFields = targetTable.columns.map((column) => ({
    key: column.key,
    label: column.name,
  }));
  console.log(dynamicColumnFields);
  return dynamicColumnFields;
  */

  // Add an 'id' field to each item in the response
  return response.data.rows.map((row) => ({
    ...row,
    id: row._id,
  }));
};

const addDynamicOutputFields = async (z, bundle) => {
  // Example API call to fetch dynamic fields
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.inputData.base_uuid}/metadata/`,
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
  console.log(generatedOutputFields);
  return generatedOutputFields;
};

module.exports = {
  key: "new_updated_row",
  noun: "New_updated_row",

  display: {
    label: "New or Updated Row ",
    description:
      "Triggers when a new row is created or a row is updated. (max xxx rows are possible in this view - otherwise the trigger will not work)",
  },

  operation: {
    perform,

    inputFields: [
      {
        key: "base_uuid",
        label: "Base",
        type: "string",
        helpText: "...",
        required: true,
      },
      {
        key: "table_id",
        label: "Table",
        type: "string",
        required: true,
      },
      {
        key: "view_id",
        label: "View",
        type: "string",
        required: true,
      },
    ],

    sample: {
      id: 1,
      _id: "Test",
    },

    outputFields: [addDynamicOutputFields],
  },
};
