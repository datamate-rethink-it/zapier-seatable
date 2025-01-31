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
  const response = await z.request({
    url: bundle.authData.serverUrl + "/api/v2.1/dtable/app-access-token/",
    method: "GET",
    body: {},
  });
  if (response.data?.use_api_gateway !== true) {
    throw new z.errors.Error(
      "Your SeaTable Server must support API-Gateway. Please update your SeaTable Server to the newest version."
    );
  }
  return {
    baseUuid: response.data.dtable_uuid,
    baseToken: response.data.access_token,
    workspaceId: response.data.workspace_id,
    baseName: response.data.dtable_name,
  };
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeApiToken = (request, z, bundle) => {
  if (request.url.includes("api/v2.1/dtable/")) {
    request.headers.Authorization = "Bearer " + bundle.authData.apiToken;
  } else {
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

    connectionLabel: "'{{baseName}}' at {{serverUrl}}",
  },
  befores: [includeApiToken],
  afters: [handleBadResponses],
};
