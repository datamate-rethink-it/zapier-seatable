const ctx = require('../ctx');
const _ = require('lodash');
const {ResponseThrottleInfo} = require('../lib');

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
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);

  const logTag = `[${bundle.__zTS}] triggers.row_create`;
  z.console.time(logTag);

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/`,
    headers: {Authorization: `Token ${dtableCtx.access_token}`},
    params: ctx.requestParamsBundle(bundle),
  });

  let rows = response.data.rows;

  const meta = bundle.meta;

  z.console.timeLog(logTag, `rows(${new ResponseThrottleInfo(response)}) length=${rows.length} meta: limit=${meta && meta.limit} isLoadingSample=${meta && meta.isLoadingSample}`);
  if (0 === rows.length) {
    return rows;
  }

  rows.reverse();
  if (meta && meta.isLoadingSample) {
    rows.splice(meta.limit || 3);
  }

  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  rows = await Promise.all(_.map(rows, async (o) => {
    const transformedObj = await ctx.mapColumnKeys(z, bundle, tableMetadata.columns, o);
    transformedObj.id = `${transformedObj.row_id}`;
    return transformedObj;
  }));
  rows = await ctx.acquireFileNoAuthLinks(z, bundle, tableMetadata.columns, rows);
  rows = await ctx.acquireLinkColumnsData(z, bundle, tableMetadata.columns, rows);

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
    {key: 'row_id', label: 'Original ID'},
    {key: 'row_mtime', label: 'Last Modified'},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
    ...ctx.outputFieldsFileNoAuthLinks(tableMetadata.columns, bundle),
  ];
};

module.exports = {
  key: 'row_create',
  noun: 'Row',
  display: {
    label: 'New Row',
    description: 'Triggers when a new row is available.',
    important: true,
  },
  operation: {
    perform,
    inputFields: [ctx.tableFields, ctx.fileNoAuthLinksField],
    sample: {
      'id': 'N33qMZ-JQTuUlx_DiF__lQ',
      'row_id': 'N33qMZ-JQTuUlx_DiF__lQ',
      'row_mtime': '2021-12-02T01:23:45.678+00:00',
      'column:0000': 'Contents of the first field; a text-field',
    },
    outputFields: [outputFields],
  },
};
