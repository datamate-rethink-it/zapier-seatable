const _CONST = require('../const');
const ctx = require('../ctx');
const {ResponseThrottleInfo} = require('../lib');
const {ZapBundle} = require('../ctx/ZapBundle');
const _ = require('lodash');

/**
 * perform
 *
 * triggers on a table row update (or create)
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  //
  const zb = new ZapBundle(z, bundle);
  //
  const logTag = `[${bundle.__zTS}] triggers.row_update`;
  z.console.time(logTag);

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/`,
    headers: {Authorization: `Token ${dtableCtx.access_token}`},
    params: ctx.requestParamsBundle(bundle),
  });

  let rows = response.data.rows;
  z.console.log("DEBUG rows", rows);

  const meta = bundle.meta;

  z.console.timeLog(logTag, `rows(${new ResponseThrottleInfo(response)}) length=${rows.length} meta: limit=${meta && meta.limit} isLoadingSample=${meta && meta.isLoadingSample}`);
  if (0 === rows.length) {
    return rows;
  }

  rows = _.orderBy(rows, ['_mtime'], ['desc']);
  if (meta && meta.isLoadingSample) {
    rows.splice(meta.limit || 3);
  }

  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

  //z.console.log("VOR mapColumnKeys", rows);

  /**
   * OUTPUT TRANSFORMATION (mapColumnKeys)
   * 
   * - enrich the output: Collaborators, Images/Files, Links
   * - rewrite the keys from like "Name:" to "column:8hzP:"
   * - different behaviour depending of fileNoAuthLinksField (true|false)
   * 
   */

  rows = await Promise.all(_.map(rows, async (o) => {
    const transformedObj = await ctx.mapColumnKeys(z, bundle, tableMetadata.columns, o);
    transformedObj.id = `${transformedObj.row_id}-${transformedObj.row_mtime}`;
    return transformedObj;
  }));

  //z.console.log("NACH mapColumnKeys", rows);

  // test neu zum aufbauen der links?? -> alles über linked columns
  //rows = await ctx.acquireLinkColumnsData(z, bundle, tableMetadata.columns, rows);
  //z.console.log("LINKS mapColumnKeys", rows);

  // this is only relevant for row_update.js
  const unfilteredLength = rows.length;
  const featureMTime = _CONST.FEATURE[_CONST.FEATURE_MTIME_FILTER] || undefined;
  if (featureMTime && featureMTime.enabled) {
    if (bundle._testFeature && bundle._testFeature[_CONST.FEATURE_MTIME_FILTER]) {
      if (bundle._testFeature[_CONST.FEATURE_MTIME_FILTER].captureRowsBeforeFilter) {
        bundle._testFeature[_CONST.FEATURE_MTIME_FILTER].capturedRows = rows;
      } else {
        bundle._testFeature[_CONST.FEATURE_MTIME_FILTER].capturedRows = null;
      }
    }
    const mTimeFilterMinutes = featureMTime.minutes;
    const MILLISECONDS_PER_MINUTE = 60000;
    const floorEpochMilliseconds = (new Date).valueOf() - (mTimeFilterMinutes * MILLISECONDS_PER_MINUTE);
    rows = _.filter(rows, (o) => {
      return Date.parse(o.row_mtime) >= floorEpochMilliseconds;
    });
    z.console.timeLog(logTag, `filtered rows length: ${rows.length} (offset=${unfilteredLength - rows.length} minutes=${mTimeFilterMinutes})`);
  }

  z.console.timeLog(logTag, `rows length: ${rows && rows.length}`);
  return rows;

};

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array.<{label: string, key: string}>>}
 */
const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  const oF = [
    {key: 'row_id', label: 'Original ID'},
    {key: 'row_mtime', label: 'Last Modified'},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
  ];
  //z.console.log("DEBUG outputFields", oF);
  return oF;
};

module.exports = {
  key: 'row_update',
  noun: 'Row Update',
  display: {
    label: 'New or Updated Row',
    description: 'Triggers when a row is updated or created.',
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
    outputFields: [outputFields,],
  },
};
