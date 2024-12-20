"use strict";

const test = (z, bundle) => {
  if (!bundle.authData.serverUrl.match(/^https?:\/\/.+[^/]$/)) {
    throw new z.errors.Error(
      "Please correct the Server URL. It must begin with https:// and should not end with a trailing slash (/). For example: https://your-seafile-server.com."
    );
  }
  z.request({
    url: bundle.authData.serverUrl + "/api/v2.1/dtable/app-access-token/",
  });
  return "Auth-Test successful";
};

const handleBadResponses = (response, z, bundle) => {
  if (response.status === 403) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      "The API-Token you supplied is incorrect",
      "AuthenticationError",
      response.status
    );
  }
  return response;
};

const getBaseToken = async (z, bundle) => {
  //console.log("getBaseToken");
  const response = await z.request({
    url: bundle.authData.serverUrl + "/api/v2.1/dtable/app-access-token/",
    method: "GET",
    body: {},
  });
  //console.log(response);
  return {
    baseToken: response.data.access_token,
  };
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeApiToken = (request, z, bundle) => {
  //console.log("request", request);
  //console.log(request.url);
  if (request.url.includes("api/v2.1/dtable/")) {
    //console.log("use ApiToken", bundle.authData.apiToken);
    request.headers.Authorization = "Bearer " + bundle.authData.apiToken;
  } else {
    //console.log("use BaseToken", bundle.authData.baseToken);
    request.headers.Authorization = "Bearer " + bundle.authData.baseToken;
  }
  return request;
};

module.exports = {
  config: {
    // "session" auth exchanges user data for a different session token (that may be
    // periodically refreshed")
    type: "session",
    sessionConfig: { perform: getBaseToken },

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [
      {
        key: "serverUrl",
        required: true,
        label: "Server",
        type: "string",
        default: "https://cloud.seatable.io",
        helpText:
          "The public SAAS Server is https://cloud.seatable.io. Only if you use your own on-premise SeaTable you have to add something else.",
      },
      {
        key: "apiToken",
        required: true,
        label: "API-Token (of a Base)",
        type: "string",
        helpText:
          "Create an [API-Token](https://seatable.io/docs/integrationen/zapier-api-tokens-sign-in/) for one of your bases inside SeaTable.",
      },
    ],

    test,

    connectionLabel: "{{serverUrl}}",
  },
  befores: [includeApiToken],
  afters: [handleBadResponses],
};
