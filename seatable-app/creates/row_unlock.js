const perform = async (z, bundle) => {
  const metadata_response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const targetTable = metadata_response.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const requestOptions = {
    method: "PUT",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/unlock-rows/`,
    body: {
      table_name: targetTable.name,
      row_ids: [bundle.inputData.row_id],
    },
  };
  const response = await z.request(requestOptions);
  return response.data;
};

module.exports = {
  key: "row_unlock",
  noun: "Row",

  display: {
    label: "Unlock Row",
    description: "Remove the lock from a row.",
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
        helpText: "Select the table containing the row to unlock.",
      },
      {
        key: "row_id",
        label: "Row",
        type: "string",
        required: true,
        helpText: "Enter the row ID of an existing row.",
        search: "find_row.id",
        dynamic: "intern_rows.id.name",
        altersDynamicFields: false,
      },
    ],
    sample: {
      success: true,
    },
    outputFields: [{ key: "success", label: "Success", type: "boolean" }],
  },
};
