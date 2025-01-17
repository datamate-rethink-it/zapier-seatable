const perform = async (z, bundle) => {
  const requestOptions = {
    method: "DELETE",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    body: {
      table_id: bundle.inputData.table_id,
      row_ids: [bundle.inputData.row_id],
    },
  };

  const response = await z.request(requestOptions);
  return response.data;
};

module.exports = {
  key: "row_delete",
  noun: "Row",
  display: {
    label: "Delete Row",
    description: "Delete an existing row in a table.",
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
        helpText: "Select the table containing the row to delete.",
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
