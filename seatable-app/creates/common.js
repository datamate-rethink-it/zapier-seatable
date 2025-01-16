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
    'formula',
    // The following columns are unsupported for now:
    'geolocation',
    'digital-sign',
  ];

  const operation = bundle.inputData.row_id ? 'update' : 'create';

  const inputs = targetTable.columns.filter((column) => !readonlyColumnTypes.includes(column.type))
    .map((column) => ({
      key: column.name,
      label: column.name,
      type: mapColumnType(column.type),
      helpText: generateHelpText(column, operation),
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
    case 'image':
      return 'file';
    default:
      return columnType;
  }
};

// operation can be "create" or "update"
const generateHelpText = (column, operation) => {
  let text = '';

  switch (column.type) {
    case 'collaborator':
      text += 'Please enter the email adress of a user. The @auth.local address will not work.';
      break;
    case 'multiple-select':
      text += 'Only supports existing options. Separate the options with a space.';
      break;
  }

  if (operation === "update") {
    text += 'Use three spaces to delete the current column value from the row.'
  }

  return text;
};

module.exports = {
  inputFields,
};
