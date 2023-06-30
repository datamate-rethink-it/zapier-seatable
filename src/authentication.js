const ctx = require("./ctx");

/**
 * Get serverInformation and validate the access-token...
 * (only necessary for initial authentication)
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{serverInfo: {access_token: string, workspace_id: number, app_name: string, dtable_server: string, metadata: DTableMetadataTables, dtable_name: string, dtable_socket: string, dtable_uuid: string, server_address: string}, dtable: Object}>}
 */
const test = async (z, bundle) => {
  const serverInfo = await ctx.acquireServerInfo(z, bundle);
  const accessToken = await ctx.acquireDtableAppAccess(z, bundle);
  return {serverInfo, dtable: accessToken};
};

/**
 * describe the connection
 * SeaTable server name, version and variant in use for the zap.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {string} {`${*} (${string} ${string}) Test Tables (Zapier Auth Test)`|`${*} (${string} ${string}) Test Tables (${string})`|`${*} (${string} ${string}) Test Tables (${*})`|`${*} (${string} ${string}) ${string} (Zapier Auth Test)`|`${*} (${string} ${string}) ${string} (${string})`|`${*} (${string} ${string}) ${string} (${*})`|`${*} (${string} ${string}) ${*} (Zapier Auth Test)`|`${*} (${string} ${string}) ${*} (${string})`|`${*} (${string} ${string}) ${*} (${*})`}
 */
const connectionLabel = (z, bundle) => {
  // remove https:// in front (but keep the non-secure to show)
  const address = bundle.authData.server.replace(/^https:\/\//, "").replace(/\/+$/, "");
  // const {serverInfo, dtable} = bundle.inputData;
  // const dtable = bundle.inputData;
  // z.console.log("DEBUG bundle in auth", bundle);
  // const editionAbbreviated = serverInfo.edition.replace("enterprise edition", "EE");
  return `${address} (${bundle.inputData.dtable.dtable_name})`; // optional: ${dtable?.app_name}
};

module.exports = {
  type: "custom",
  test,
  fields: [
    {
      computed: false,
      key: "server",
      required: true,
      label: "Server",
      type: "string",
      default: "https://cloud.seatable.io",
      helpText: "The public SAAS Server is [https://cloud.seatable.io](https://cloud.seatable.io). Only if you use your own on-premise SeaTable you have to add something else.",
    },
    {
      computed: false,
      key: "api_token",
      required: true,
      label: "API-Token (of a Base)",
      type: "string",
      helpText: "Create an [API-Token](https://seatable.io/docs/integrationen/zapier-api-tokens-sign-in/) for one of your bases inside SeaTable.",
    },
  ],
  connectionLabel,
  customConfig: {},
};
