const ctx = require("./ctx");

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{serverInfo: {access_token: string, workspace_id: number, app_name: string, dtable_server: string, metadata: DTableMetadataTables, dtable_name: string, dtable_socket: string, dtable_uuid: string, server_address: string}, dtable: Object}>}
 */
module.exports = async (z, bundle) => {
  const serverInfo = await ctx.acquireServerInfo(z, bundle);

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
    headers: {
      "Authorization": `Token ${bundle.authData.api_token}`,
      "x-zapier-auth-test": `${JSON.stringify(bundle?.meta?.isTestingAuth)}`,
    },
    endPointPath: "/api/v2.1/dtable/app-access-token/",
  });

  // becomes bundle.inputData
  return {serverInfo, dtable: response.data};
};
