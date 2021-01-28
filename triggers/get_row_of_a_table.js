const ctx = require('../ctx')
const _ = require('lodash')

/**
 * perform
 *
 * internal fetch rows of a table
 *
 * @param z
 * @param bundle
 * @returns {Promise<{json: {id: string, Name: string}}[]>}
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
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)
  return _.map(_.map(rows, (o) => ctx.mapColumnKeys(tableMetadata.columns, o)), (r) => {
        return {
          id: `table:${tableMetadata._id}:row:${r.row_id}`,
          name: r['column:0000'], // r['column:0000'] can be "undefined", perhaps filter first
        }
      },
  )
}

module.exports = {
  key: 'get_row_of_a_table',
  noun: 'Row',
  display: {
    label: 'Hidden: Get row of a table',
    description: 'Internal trigger to get the rows of a table.',
    hidden: true,
    important: false,
  },
  operation: {
    perform,
    sample: {id: 'table:0000:row:xYz...', name: 'Name1'},
    outputFields: [{key: 'id'}, {key: 'name'}],
  },
}
