/**
 * functions to generate the input fields dynamically
 **/

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
    "creator",
    "last-modifier",
    "ctime",
    "mtime",
    "auto-number",
    "button",
    "formula",
    "link-formula",
    // The following columns are unsupported for now:
    "geolocation",
    "digital-sign",
  ];

  const operation = bundle.inputData.row_id ? "update" : "create";

  const inputs = targetTable.columns
    .filter((column) => !readonlyColumnTypes.includes(column.type))
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
    case "checkbox":
      return "boolean";
    case "rate":
      return "integer";
    case "date":
      return "datetime";
    case "image":
      return "file";
    case "long-text":
      return "text";
    case "text":
      return "string";
    default:
      return columnType;
  }
};

// operation can be "create" or "update"
const generateHelpText = (column, operation) => {
  let text = "";

  switch (column.type) {
    case "collaborator":
      text +=
        "Please enter the @auth.local address, the email adress or the name of the user.";
      break;
    case "number":
      text +=
        'Enter any numeric value. Decimals must be separated from the integer with a period ".".';
      break;
    case "single-select":
      text += "Single select column only accepts existing options.";
      break;
    case "multiple-select":
      text +=
        'Only supports existing options. Separate the options with a space. If one of your options has a space in it, encapsulate it with double quotes, like "Option 1". Option names containing double quotes are not supported.';
      break;
    case "duration":
      text +=
        'Please enter the duration in seconds (like "90" for "0:01:30") or in time format ("1:45").';
    case "rate":
      text += "Rating column accepts whole number values.";
      break;
    case "link":
      text += "Please enter the row id of the target row.";
      break;
  }

  if (operation === "update") {
    if (text.length > 0) {
      text += " ";
    }
    text += "Use three spaces to delete the current column value from the row.";
  }

  return text;
};

module.exports = {
  inputFields,
};
