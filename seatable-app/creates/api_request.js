const { isJsonString } = require("../utils");

const perform = async (z, bundle) => {
  const regex = /^\/api-gateway\/.*/;
  if (!regex.test(bundle.inputData.endpoint)) {
    throw new Error(
      "The URL of your request must start with /api-gateway/. Please change the URL and try again."
    );
  }

  // check body input
  z.console.log("inputDataRaw.body", bundle.inputData.body);
  if (!isJsonString(bundle.inputData.body)) {
    throw new Error("Your body seems to be no valid JSON.");
  }
  const body = bundle.inputData.body;

  const request = {
    url: `${bundle.authData.serverUrl}${bundle.inputData.endpoint}`,
    method: `${bundle.inputData.http_method}`,
    params: bundle.inputData.querys,
    body: JSON.parse(body),
  };

  const response = await z.request(request);
  return response.data;
};

module.exports = {
  key: "api_request",
  noun: "API Request (Beta)",

  display: {
    label: "API Request (Beta)",
    description:
      "This is an advanced action to execute a SeaTable API call via Zapier on this base. This is useful if you would like to use an API endpoint like `Create a new table` that Zapier doesn't implement yet. You can get all possible requests and their parameters from the https://api.seatable.io.",
  },

  operation: {
    perform,

    inputFields: [
      {
        key: "http_method",
        required: true,
        label: "HTTP Method",
        choices: { POST: "POST", GET: "GET", PUT: "PUT", DELETE: "DELETE" },
      },
      {
        key: "endpoint",
        required: true,
        label: "URL",
        helpText:
          "The URL has to start with */api-gateway/*. All possible requests can be found at the [SeaTable API Reference](https://api.seatable.io). Please be aware that only request from the section **Base Operations** that use an **Base-Token** for the authentication are allowed to use.",
        type: "string",
      },
      {
        key: "alert",
        type: "copy",
        helpText: "The Authentication header is included automatically.",
      },
      {
        key: "querys",
        label: "Query String Parameters",
        helpText:
          "These params will be URL-encoded and appended to the URL when making the request.",
        dict: true,
      },
      {
        key: "body",
        required: false,
        label: "Body",
        helpText:
          'Only valid JSON is accepted. Zapier will pass anything you enter as raw input. For example, `{"foo", "bar"}` is perfectly valid. Of cause you can use variables from Zapier inside your JSON.',
        type: "text",
        default: "{}",
      },
    ],
    sample: { success: true },
    outputFields: [{ key: "success", type: "boolean" }],
  },
};
