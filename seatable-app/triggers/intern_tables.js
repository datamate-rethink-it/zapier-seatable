// Fetches a list of records from the endpoint
const perform = async (z, bundle) => {
  // set default return.
  const returnData = [];

  if (!bundle.authData.baseUuid) {
    console.log("baseUuid is not set or empty...");
    return returnData;
  }

  const request = {
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
    params: {},
  };

  const response = await z.request(request);

  if (response.data.metadata.tables) {
    for (const table of response.data.metadata.tables) {
      returnData.push({
        id: table._id,
        name: table.name + " (in Base '" + bundle.authData.baseName + "')",
      });
    }
  }
  return returnData;
};

module.exports = {
  key: "intern_tables",
  noun: "Tables",
  display: {
    label: "List of Tables",
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
