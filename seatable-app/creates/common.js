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

  const inputs = targetTable.columns.filter((column) => !readonlyColumnTypes.includes(column.type))
    .map((column) => ({
      key: column.name,
      label: column.name,
      type: mapColumnType(column.type),
      helpText: generateHelpText(column),
      required: false,
    }));

  if (bundle.inputData.row_id) {
    console.log(bundle.inputData);
  }

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
  inputFields,
};
