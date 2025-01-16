const perform = async (z, bundle) => {
  if (!bundle.authData.baseUuid) {
    console.log("baseUuid is not set or empty...");
    return [];
  }

  const metadata = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const targetTable = metadata.json.metadata.tables.find((table) => table._id === bundle.inputData.table_id);
  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const firstColumn = targetTable.columns.find(column => column.key === '0000');
  if (!firstColumn) {
    throw new Error(`Table ${targetTable.name} does not have a column with the key "0000"`);
  }

  const request = {
    method: "POST",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/sql/`,
    body: {
      sql: "SELECT `" + firstColumn.name + "`, _id FROM `" + targetTable.name + "` LIMIT 10",
    },
  };

  const response = await z.request(request);

  const rows = response.data.results.map(row => ({
    id: row._id,
    name: row["0000"],
  }));

  return rows;
};

module.exports = {
  key: "intern_rows",
  noun: "Row",
  display: {
    label: "List of Rows",
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
