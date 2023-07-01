const ctx = require("../ctx");
const _ = require("lodash");
// const {ResponseThrottleInfo} = require("../lib");

/**
 * perform
 *
 * triggers on a new row in table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
  // add bundle.dtable, bundle.dtable.tableMetadata and bundle.dtable.collaborators
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  collaborators = await ctx.acquireCollaborators(z, bundle);

  /**
   * get rows of the table
   * @type {ZapierZRequestResponse}
   * */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/`,
    headers: {Authorization: `Token ${dtableCtx.access_token}`},
    params: ctx.requestParamsBundle(bundle),
  });

  let rows = response.data.rows;
  if (0 === rows.length) {
    return rows;
  }

  // determine _ctime and _mtime column name. _ctime and _mtime change if these columns are set.
  const ctime = _.find(tableMetadata.columns, ["type", "ctime"]);

  // limit payload size
  // https://platform.zapier.com/docs/constraints#payload-size-triggers
  // rows.reverse();
  rows = _.orderBy(rows, [ctime.name], ["desc"]);
  if (bundle.meta && bundle.meta.isLoadingSample) {
    rows.splice(bundle.meta.limit || 3);
  }

  // transform the results and enhance the return values
  rows = await Promise.all(_.map(rows, async (o) => {
    const transformedObj = await ctx.mapColumnKeysAndEnhanceOutput(z, bundle, tableMetadata.columns, o);
    transformedObj.id = `${transformedObj.row_id}`;
    return transformedObj;
  }));

  return rows;
};


/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array.<{label: string, key: string}>>}
 */
const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  return [
    {key: "row_id", label: "Original ID"},
    {key: "row_mtime", label: "Last modification time"},
    {key: "row_ctime", label: "Creation time"},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
  ];
};


module.exports = {
  key: "row_create",
  noun: "Row",
  display: {
    label: "New Row",
    description: "Triggers once when a new row is found.",
    important: true,
  },
  operation: {
    perform,
    inputFields: [ctx.tableFields, ctx.fileNoAuthLinksField],
    sample: {
      "id": "N33qMZ-JQTuUlx_DiF__lQ",
      "row_id": "N33qMZ-JQTuUlx_DiF__lQ",
      "row_mtime": "2021-12-02T01:23:45.678+00:00",
      "column:0000": "Contents of the first field; a text-field",
    },
    outputFields: [outputFields],
  },
};


