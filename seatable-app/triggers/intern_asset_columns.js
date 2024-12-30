// Fetches a list of records from the endpoint
const perform = async (z, bundle) => {
  const returnData = [];

  if (!bundle.authData.baseUuid) {
    console.log("baseUuid is not set or empty...");
    return returnData;
  }

  if (!bundle.inputData.table_name) {
    console.log("table_name is not set or empty...");
    return returnData;
  }

  console.log(bundle.inputData);

  const request = {
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
    params: {},
  };

  const response = await z.request(request);

  if (response.data.metadata.tables) {
    for (const table of response.data.metadata.tables) {
      if (table.name === bundle.inputData.table_name) {
        for (const column of table.columns) {
          if (
            column.type === "image" ||
            column.type === "file" ||
            column.type === "digital-sign"
          ) {
            returnData.push({
              id: column.key,
              name: column.name,
            });
          }
        }
      }
    }
  }
  return returnData;
};

module.exports = {
  key: "intern_asset_columns",
  noun: "Asset Columns",
  display: {
    label: "List of Asset Columns",
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
