const ctx = require("../ctx");
const _ = require("lodash");

/**
 * perform
 *
 * internal fetch rows of a table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{json: {id: string, Name: string}}[]>}
 */
const perform = async (z, bundle) => {
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/`,
    headers: {Authorization: `Token ${dtableCtx.access_token}`},
    params: ctx.requestParamsBundle(bundle),
  });
  const rows = response.data.rows;
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  return await Promise.all(_.map(rows, async (o) => {
    const transformedObj = await ctx.mapColumnKeysRow(tableMetadata.columns, o);
    return {
      id: transformedObj.row_id,
      name: transformedObj["column:0000"],
    };
  }));
};

module.exports = {
  key: "get_row_of_a_table",
  noun: "Row",
  display: {
    label: "Hidden: Get row of a table",
    description: "Internal trigger to get the rows of a table.",
    hidden: true,
    important: false,
  },
  operation: {
    perform,
    sample: {id: "table:0000:row:xYz...", name: "Name1"},
    outputFields: [{key: "id"}, {key: "name"}],
  },
};
