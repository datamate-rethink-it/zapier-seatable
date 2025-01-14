const { inputFields } = require('./common');
const { getCollaborators } = require('../utils');

const perform = async (z, bundle) => {
  // TODO

  // TODO: Limit code duplication
  const metadata_response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const targetTable = metadata_response.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  // TODO: Only execute this request if there's at least a single collaborator column
  const collaborators = await getCollaborators(z, bundle);

  const row = {};

  for (const [key, value] of Object.entries(bundle.inputData)) {
    // Skip table_id
    if (key === 'table_id') {
      continue;
    }

    const column = targetTable.columns.find(column => column.name === key);
    if (!column) {
      continue;
    }

    // Handle "special" column types
    switch (column.type) {
      case 'collaborator':
        // Get the @auth.local email address
        row[key] = [collaborators.find(c => c.contact_email === value)?.email];
        break;
      case 'file':
        const uploadLink = await getUploadLink(z, bundle);
        console.log(uploadLink)
        await uploadFile(z, uploadLink, value);
        // TODO
        break;
      default:
        row[key] = value;
        break;
    }
  }

  const requestOptions = {
    method: "PUT",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    body: {
      table_id: bundle.inputData.table_id,
      updates: [
        {
          row_id: bundle.inputData.row_id,
          row: row,
        },
      ],
    },
  };

  const response = await z.request(requestOptions);

  // TODO: Return data
  console.log(response.json);
};

const addDynamicOutputFields = async (z, bundle) => {
  // TODO
};

module.exports = {
  key: "row_update",
  noun: "Row Update",
  display: {
    label: "Update Row",
    description: "Updates an existing row, probably with input from previous steps.",
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
      {
        key: "row_id",
        label: "Row ID",
        type: "string",
        required: true,
        helpText: "Enter the row ID of an existing row.",
      },
      inputFields,
    ],
    /* TODO
    sample: {
      _ctime: "2024-12-29T15:33:30+01:00",
      _mtime: "2024-12-29T17:25:34+01:00",
      _id: "c1kYssFbSWWX5KT6yukooQ",
      id: "c1kYssFbSWWX5KT6yukooQ_2024-12-29T17:25:34+01:00",
    },*/
    outputFields: [addDynamicOutputFields],
  },
};
