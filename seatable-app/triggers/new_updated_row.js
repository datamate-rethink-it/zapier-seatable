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

  // Add an 'id' field to each item in the response
  return response.data.rows.map((row) => ({
    ...row,
    id: row._id,
  }));
};

module.exports = {
  key: "new_updated_row",
  noun: "New_updated_row",

  display: {
    label: "New or Updated Row ",
    description: "Triggers when a new row is created or a row is updated.",
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
      name: "Test",
    },

    outputFields: [],
  },
};
