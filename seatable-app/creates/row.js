const { enrichColumns, getCollaborators, getUploadLink, uploadFile } = require("../utils");

const perform = async (z, bundle) => {
  // TODO: handle single-select, multiple-select, collaborator, images, urls, ...

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
    method: "POST",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    body: {
      table_id: bundle.inputData.table_id,
      rows: [row],
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

  const readonlyColumnTypes = [
    'creator',
    'last-modifier',
    'ctime',
    'mtime',
    'auto-number',
    'button',
    // The following columns are unsupported for now:
    'geolocation',
    'digital-sign',
  ];

  const inputs = targetTable.columns.filter((column) => !readonlyColumnTypes.includes(column.type))
    .map((column) => ({
      key: column.name,
      label: column.name,
      type: mapColumnType(column.type),
      helpText: generateHelpText(column),
      required: false,
    }));

  return inputs;
};

// Map from SeaTable column types to Zapier field types
const mapColumnType = (columnType) => {
  switch (columnType) {
    case 'checkbox':
      return 'boolean';
    case 'rating':
      return 'integer';
    case 'date':
      return 'datetime';
    default:
      return columnType;
  }
};

const generateHelpText = (column) => {
  switch (column.type) {
    case 'collaborator':
      return 'Please enter the email adress of a user. The @auth.local address will not work.';
    case 'multiple-select':
      return 'Only supports existing options. Separate the options with a space.';
    default:
      return undefined;
  }
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
