const searchableColumnTypes = [
  "text",
  "long-text",
  "number",
  "single-select",
  "email",
  "url",
  "rate",
  "formula",
];

const perform = async (z, bundle) => {
  const returnData = [];

  if (!bundle.authData.baseUuid) {
    return returnData;
  }

  if (!bundle.inputData.table_id) {
    return returnData;
  }

  const metadata = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const table = metadata.data.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );
  if (!table) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const columns = table.columns
    .filter((column) => searchableColumnTypes.includes(column.type))
    .map((column) => ({ id: column.key, name: column.name }));

  return columns;
};

module.exports = {
  key: "intern_search_columns",
  noun: "Column",
  display: {
    label: "List of Searchable Columns",
    description:
      "This is a hidden trigger, and is used in a Dynamic Dropdown of another trigger.",
    hidden: true,
  },
  operation: {
    // Since this is a "hidden" trigger, there aren't any inputFields needed
    perform,
    canPaginate: false,
  },
};
