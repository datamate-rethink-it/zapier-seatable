const ctx = require('../ctx')
const _ = require('lodash')

/**
 * perform
 *
 * triggers on a new row in table
 *
 * @param z
 * @param bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle)

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/`,
    headers: {Authorization: `Token ${dtableCtx.access_token}`},
    params: ctx.requestParamsBundle(bundle),
  })

  let rows = response.data.rows
  rows.reverse()

  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)

  rows = _.map(_.map(rows, (o) => ctx.mapColumnKeys(tableMetadata.columns, o)), (o) => {
    o.id = o.row_id
    return o
  })

  rows = await ctx.acquireFileNoAuthLinks(z, bundle, tableMetadata.columns, rows)
  rows = await ctx.acquireLinkColumnsData(z, bundle, tableMetadata.columns, rows)

  return rows
}

const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)

  return [
    {key: 'row_id', label: 'Original ID'},
    {key: 'row_mtime', label: 'Last Modified'},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
    ...ctx.outputFieldsFileNoAuthLinks(tableMetadata.columns, bundle),
  ]
}

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
      id: 'N33qMZ-JQTuUlx_DiF__lQ',
      row_id: 'N33qMZ-JQTuUlx_DiF__lQ',
      row_mtime: '2021-12-02T01:23:45.678+00:00',
      'column:0000': 'Contents of the first field; a text-field',
    },
    outputFields: [outputFields],
  },
}
