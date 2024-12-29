// Fetches a list of records from the endpoint
const perform = async (z, bundle) => {
  // set default return.
  const returnData = [];

  if (!bundle.authData.baseUuid) {
    console.log("baseUuid is not set or empty...");
    return returnData;
  }

  if (!bundle.inputData.table_id) {
    console.log("table_id is not set or empty...");
    return returnData;
  }

  const request = {
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/views/`,
    params: {
      table_id: bundle.inputData.table_id,
    },
  };

  const response = await z.request(request);

  if (response.data.views) {
    for (const view of response.data.views) {
      returnData.push({
        id: view._id,
        name: view.name,
      });
    }
  }
  return returnData;
};

module.exports = {
  key: "intern_views",
  noun: "Views",
  display: {
    label: "List of Views",
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
