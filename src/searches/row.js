const ctx = require('../ctx')
const _ = require('lodash')

/**
 * perform
 *
 * finds a particular row by column and value in table
 *
 * @param z
 * @param bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle)

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/filtered-rows/`,
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
    params: ctx.requestParamsSid(bundle.inputData.table_name),
    allowGetBody: true,
    body: {'filters': [await ctx.filter(z, bundle, 'search')]},
  })

  let rows = response.data.rows

  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)

  rows = _.map(rows, (o) => ctx.mapColumnKeys(tableMetadata.columns, o))

  rows = await ctx.acquireFileNoAuthLinks(z, bundle, tableMetadata.columns, rows)
  rows = await ctx.acquireLinkColumnsData(z, bundle, tableMetadata.columns, rows)

  return rows
}

const searchColumn = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)
  const choices = _.merge(..._.map(_.filter(tableMetadata.columns, (o) => {
    return !ctx.struct.columns.filter.not.includes(o.type)
        && !ctx.struct.columns.zapier.hide_search.includes(o.type)
  }), (o) => {
    return {[`column:${o.key}`]: o.name}
  }))
  return {
    key: 'search_column',
    required: true,
    label: 'Column',
    helpText: 'Pick a field from the Seatable table for your search.',
    altersDynamicFields: true,
    choices,
  }
}

/**
 * Dynamic Input Field for the Search Value
 *
 * The input is yet un-typed, Zapier offers the following 'type' string values:
 *
 * 'string', 'text', 'integer', 'number', 'boolean', 'datetime', 'file', 'password', 'copy'
 *
 * The first implementation of the find operates with string inputs (un-typed or string-typed) and it is looking
 * good so far.
 *
 * SeaTable supports "date-string" for column types 'date', 'ctime' and 'mtime'. If the format is compatible
 * date-time specific inputs can be done, however with free-text input it might be that SeaTable also supports
 * relative formats which Zapier for what I know does not support. (STZ-0016)
 *
 * @param z
 * @param bundle
 * @return {Promise<{helpText: string, label: string, altersDynamicFields: boolean, key: string, required: boolean}>}
 */
const searchValue = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)
  const colSid = ctx.sidParse(bundle.inputData.search_column)
  const col = _.find(tableMetadata.columns, ['key', colSid.column])
  const r = {
    key: 'search_value',
    required: true,
    label: 'Search Value',
    helpText: 'The unique value to search for in field.',
    altersDynamicFields: true,
  }
  if (col !== undefined) {
    r.helpText = `The unique value to search for in ${ctx.struct.columns.types[col.type] || `[${col.type}]`} field named "${col.name}".`
  }
  return r
}

const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle)

  return [
    {key: 'row_id', label: 'ID'},
    {key: 'row_mtime', label: 'Last Modified'},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
    ...ctx.outputFieldsFileNoAuthLinks(tableMetadata.columns, bundle),
  ]
}

module.exports = {
  key: 'row',
  noun: 'Row',
  display: {
    label: 'Find Row',
    description: 'Finds a row in a SeaTable table.',
    important: true,
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'table_name',
        required: true,
        label: 'Table',
        helpText: 'Pick a SeaTable table you want to search.',
        type: 'string',
        dynamic: 'get_tables_of_a_base.id.name',
        altersDynamicFields: true,
      },
      searchColumn,
      searchValue,
      ctx.fileNoAuthLinksField,
    ],
    sample: {
      row_id: 'S34-T4b13yuRKHvQa0L_kyNQC',
      row_mtime: '2021-12-02T01:23:45.678+00:00',
      'column:0000': 'Contents of the first field; a text-field',
    },
    outputFields: [outputFields],
  },
}
