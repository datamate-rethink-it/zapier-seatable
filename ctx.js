/*
 * seatable api context for zapier
 *
 * Written by Tom Klingenberg
 * Copyright 2021 SeaTable GmbH, Mainz
 */

const _ = require('lodash')

/* SeaTable Rest API Schema
 *
 * The schema is kept complete to usage only, no full API schema
 */

/**
 * @typedef {object} DTable
 * @property {string} app_name
 * @property {string} access_token
 * @property {string} dtable_uuid
 * @property {string} dtable_server
 * @property {string} dtable_socket
 * @property {number} workspace_id
 * @property {string} dtable_name
 */

/**
 * @typedef {DTable} DTableEx
 * @property {*} metadata dtable local metadata cache
 */

/**
 * @typedef {object} DTableMetadata
 * @property {DTableMetadataTables} metadata
 */

/**
 * @typedef {object} DTableMetadataTables
 * @property {Array<DTableTable>} tables
 */

/**
 * @typedef {object} DTableTable
 * @property {string} _id
 * @property {string} name
 * @property {Array<DTableColumn>} columns
 * @property {Array<DTableView>} views
 */

/**
 * @typedef {object} DTableColumn
 * @property {string} key
 * @property {string} name
 * @property {string} type
 */

/**
 * typedef {object} DTableView
 */

/**
 * @typedef {DTableColumn} DTableColumnTLink
 * @property {'link'} type
 * @property {DTableColumnTLinkData} data
 */

/**
 * @typedef DTableColumnTLinkData
 * @property {string} display_column_key example: 0000
 * @property {string} table_id example: 0000
 * @property {string} other_table_id example: P8z8
 * @property {boolean} is_internal_link example: true
 * @property {string} link_id example: pTbM
 */

/**
 * @typedef {object} DTableView
 * @property {string} _id
 * @property {string} name
 * @property {Array<string>} hidden_columns by their column keys
 */

/**
 * @typedef {object} DTableRow
 */

/* Zapier API Bindings
 *
 * binding lightly for prototyping
 */

/**
 * @typedef {object} ZapierZRequestResponse
 * @property {object} data
 */

/**
 * @typedef {ZapierZRequestResponse} DTableMetadataResponse
 * @property {DTableMetadata} data
 */

/**
 * @typedef {ZapierZRequestResponse} DTableCreateRowResponse
 * @property {DTableRow} data
 */

/**
 * @typedef {object} ZapierBundle
 */

/**
 * context bound dtable struct
 *
 * @type {{columns: {filter: {not: [string, string, string, string]}, types: {date: string, image: string, creator: string, link: string, 'auto-number': string, mtime: string, url: string, collaborator: string, duration: string, number: string, 'multiple-select': string, file: string, 'single-select': string, checkbox: string, formula: string, ctime: string, text: string, 'long-text': string, email: string, geolocation: string, 'last-modifier': string}, zapier: {hide_write: string[]}}}}
 */
const struct = {
  columns: {
    types: {
      text: 'Text',
      number: 'Number',
      checkbox: 'Checkbox',
      date: 'Date',
      'single-select': 'Single Select',
      'long-text': 'Long Text',
      image: 'Image',
      file: 'File',
      'multiple-select': 'Multiple Select',
      collaborator: 'Collaborator',
      url: 'URL',
      email: 'Email',
      duration: 'Duration',
      geolocation: 'Geolocation',
      formula: 'Formula',
      link: 'Link other records',
      'auto-number': 'Auto number',
      creator: 'Creator',
      ctime: 'Created time',
      'last-modifier': 'Last Modifier',
      mtime: 'Last modified time',
    },
    assets: ['file', 'image'],
    filter: {
      // columns types that can not be filtered:
      not: ['file', 'long-text', 'image', 'url'],
    },
    zapier: {
      // column types that zapier must not write/create (hidden):
      hide_write: ['file', 'image', 'link', 'auto-number', 'ctime', 'mtime', 'formula'],
      // column types that zapier should not offer to search in (hidden):
      hide_search: ['link'],
    },
  },
}

/**
 * @returns {Promise<DTable>}
 */
async function appAccessToken(z, bundle) {
  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
        url: `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
        headers: {Authorization: `Token ${bundle.authData.api_token}`},
      },
  )

  bundle.dtable = {}

  for (let property in response.data)
    if (response.data.hasOwnProperty(property))
      bundle.dtable[property] = response.data[property]

  return bundle.dtable
}

/**
 * bind dtable in bundle
 *
 * does authentication via appAccessToken()
 *
 * @param z
 * @param bundle
 * @return {Promise<DTable>}
 */
const acquireDtableAppAccess = (z, bundle) => {
  return isEmpty(bundle.dtable) ? appAccessToken(z, bundle) : Promise.resolve(bundle.dtable)
}

const FEATURE_NO_AUTH_ASSET_LINKS = 'feature_non_authorized_asset_downloads'
/**
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 */
const fileColumns = (columns) => columns.filter((s) => struct.columns.assets.indexOf(s.type) + 1)
const noAuthColumnKey = (key) => `column:${key}-(no-auth-dl)`
const noAuthColumnLabel = (name) => `${name} (Download w/o Authorization)`
const noAuthFilePathFromUrl = (buffer) => {
  // 'https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg'
  const probe = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(buffer)
  return probe && probe[1]
}

const fileNoAuthLinksField = {
  key: FEATURE_NO_AUTH_ASSET_LINKS,
  required: false,
  default: 'False',
  type: 'boolean',
  label: 'Provide access to images and files',
  helpText: 'By default (**False**) SeaTable provides links to files and images that require authentication. Choose **True** if you want to use your files and pictures in your Zapier Action, this adds additional fields with links that temporarily allow unauthorized downloads for a couple of hours.',
  altersDynamicFields: false,
}

/**
 * @yield {*<{label: string, key: string}>}
 */
const outputFieldsFileNoAuthLinks = function* (columns, bundle) {
  if (!bundle.inputData[FEATURE_NO_AUTH_ASSET_LINKS]) {
    return
  }

  for (const col of fileColumns(columns)) {
    yield {key: noAuthColumnKey(col.key), label: noAuthColumnLabel(col.name)}
  }
}

/**
 * add non-authorized asset links into the result
 *
 * images and files, original data type (string or object) is kept, ads a new, suffixed entry.
 *
 * @param z
 * @param bundle
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @param {Array<{object}>} rows
 */
const acquireFileNoAuthLinks = async (z, bundle, columns, rows) => {
  if (!bundle.inputData[FEATURE_NO_AUTH_ASSET_LINKS]) {
    return rows
  }

  const dtableCtx = bundle.dtable
  const fileUrlStats = {urls: [], errors: []}
  const fileUrl = async (buffer) => {
    fileUrlStats.urls.push(buffer)
    const urlPath = noAuthFilePathFromUrl(buffer)
    if (!urlPath) {
      throw new z.errors.Error(`Failed to extract path from url: "${buffer}"`)
    }
    /** @type {ZapierZRequestResponse} */
    let response
    let exception
    const url = `${bundle.authData.server}/api/v2.1/dtable/app-download-link/?path=${urlPath}`
    try {
      response = await z.request({
        url,
        headers: {Authorization: `Token ${dtableCtx.access_token}`},
        skipThrowForStatus: true,
      })
    } catch (e) {
      exception = e
    }
    if (!_.isObject(response && response.data)) {
      fileUrlStats.errors.push([buffer, urlPath, url, response, exception && exception.message])
      return null
    }
    return response.data.download_link || null
  }
  z.console.time('acquireFileNoAuthLinks')
  rows = await Promise.all(rows.map(async (row) => {
    for (const column of fileColumns(columns)) {
      const field = `column:${column.key}`
      const noAuthField = noAuthColumnKey(column.key)
      let values = row && row[field]
      if (!values) continue
      if (!Array.isArray(values)) continue
      if (!values.length) continue
      row[noAuthField] = await Promise.all(values.map(async (value) => {
        if (typeof value === 'object' && value !== null && value.type === 'file' && value.url) {
          const copy = {...value}
          copy.url = await fileUrl(value.url)
          return copy
        } else if (typeof value === 'string' && value) {
          return await fileUrl(value)
        }
        return value
      }))
    }
    return row
  }))
  z.console.timeEnd('acquireFileNoAuthLinks')
  z.console.log(`acquireFileNoAuthLinks: ${fileUrlStats.urls.length} (errors: ${fileUrlStats.errors.length})`)
  if (fileUrlStats.errors.length > 0) {
    z.console.log('acquireFileNoAuthLinks: error(s); fileUrlStats.errors:', fileUrlStats.errors)
  }
  return rows
}

/**
 * replace column.type link references with row-data in rows
 *
 * for the first reference-id if any
 *
 * @param z
 * @param bundle
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @param {Array<{object}>} rows
 */
const acquireLinkColumnsData = async (z, bundle, columns, rows) => {
  const dtableCtx = bundle.dtable

  for (let i = 0, l = rows.length; i < l; i++) {
    const row = rows[i]
    // handle each link field (if any)
    for (const o of columns) {
      const linkTableMetadata = columnLinkTableMetadata(o, bundle)
      if (undefined === linkTableMetadata) {
        continue
      }
      const childIds = row[`column:${o.key}`]
      if (!Array.isArray(childIds)) {
        continue
      }
      childIds.length = Math.min(1, childIds.length) // only the first linked row

      const children = []
      for (const childId of childIds) {
        /** @type {ZapierZRequestResponse} */
        const response = await z.request({
          url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/${childId}/`,
          headers: {Authorization: `Token ${dtableCtx.access_token}`},
          params: {table_id: linkTableMetadata._id},
        })
        if (!_.isObject(response.data)) {
          throw new z.errors.Error(`Failed to retrieve table:${linkTableMetadata._id}:row:${childId}`)
        }
        const childRow = mapColumnKeys(_.filter(linkTableMetadata.columns, (c) => c.type !== 'link'), response.data)
        children.push(childRow)
      }

      if (children.length) {
        rows[i][`column:${o.key}`] = children
      } else {
        delete rows[i][`column:${o.key}`] // remove parent key as it has no children
      }
    }
  }

  return rows
}

/**
 * helper function to fetch dtable metadata
 *
 * if the bundle.dtable.metadata entry is undefined, set it with the metadata
 * from the dtables api.
 *
 * @param z
 * @param bundle
 * @returns {Promise<DTableMetadataTables>}
 */
const acquireMetadata = async (z, bundle) => {
  /** @type {DTableEx} */
  const dtableCtx = await module.exports.acquireDtableAppAccess(z, bundle)
  if (undefined !== dtableCtx.metadata) {
    return dtableCtx.metadata
  }

  /** @type {DTableMetadataResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/metadata/`,
    headers: {
      Authorization: `Token ${dtableCtx.access_token}`,
      'X-TABLE': bundle.inputData.table_name,
    },
  })

  bundle.dtable.metadata = response.data.metadata
  return response.data.metadata
}

/**
 * get table metadata from bundle input (table_name)
 *
 * if no input table_name given, returns DTableTable null-object as previously
 * this was undefined which leads to errors as most often properties of the
 * table meta-data are accessed directly without further checks which
 * lead to error of this kind:
 *
 *    Unhandled error: TypeError: Cannot read property 'columns' of undefined
 *
 * and this error should be defined out of existence as per that request there
 * is no such table-metadata.
 *
 * @param z
 * @param bundle
 * @returns {Promise<DTableTable>}
 */
const acquireTableMetadata = async (z, bundle) => {
  const metadata = await acquireMetadata(z, bundle)
  if (!bundle.inputData.table_name) {
    return {
      _id: undefined,
      name: undefined,
      columns: [],
      views: [],
    }
  }
  const tableMetadata = tableFromMetadata(metadata, bundle.inputData.table_name)
  if (!tableMetadata) {
    z.console.log('internal: acquireTableMetadata: missing table metadata columns on input-data:', bundle.inputData)
  }
  return tableMetadata
}

/**
 * get table metadata from bundle input (table_name) and out of it
 *
 * NOTE: for this function to work, the bundle must already be bound to a dtable
 *       and its meta-data.
 *
 * @return {DTableTable}
 */
function bundle_table_meta(bundle) {
  if (!bundle.dtable) {
    throw new Error('internal error: dtable not bundled')
  }
  const dtableCtx = bundle.dtable
  if (!dtableCtx.metadata) {
    throw new Error('internal error: metadata bindings missing')
  }
  return tableFromMetadata(dtableCtx.metadata, bundle.inputData.table_name)
}

/**
 * row filter
 *
 * dtable metadata to row filter in z, bundle context
 *
 * @param z
 * @param bundle
 * @param {string} context label for logging
 * @return {Promise<{filter_predicate: string, filter_term: string, column_name: null, filter_term_modifier: string}>}
 */
const filter = async (z, bundle, context) => {
  const f = {
    column_name: null,
    filter_predicate: 'contains',
    filter_term: bundle.inputData.search_value,
    filter_term_modifier: '',
  }
  const tableMetadata = await acquireTableMetadata(z, bundle)
  const sid = sidParse(bundle.inputData.search_column)
  const col = _.find(tableMetadata.columns, ['key', sid.column])
  if (undefined === col) {
    z.console.log(`filter[${context}]: search column not found:`, bundle.inputData.search_column, sid, tableMetadata.columns)
    return f
  }
  if (struct.columns.filter.not.includes(col.type)) {
    z.console.log(`filter[${context}]: known unsupported column type (user will see an error with clear description):`, col.type)
    throw new z.errors.Error(`Search in ${struct.columns.types[col.type] || `[${col.type}]`} field named "${col.name}" is not supported, please choose a different column.`)
  }
  f.column_name = col.name
  switch (col.type) {
    case 'text':
    case 'formula':
      break
    case 'number':
      f.filter_predicate = 'equal'
      break
    case 'auto-number':
    case 'checkbox':
    case 'single-select':
    case 'date':
    case 'ctime':
    case 'mtime':
      f.filter_predicate = 'is'
      break
    case 'multi-select':
      f.filter_predicate = 'has_any_of'
      f.filter_term = [f.filter_term]
      break
    case 'creator':
    case 'last-modifier':
      f.filter_term = [f.filter_term]
      break
    default:
      z.console.log(`filter[${context}]: unknown column type (fall-through):`, col.type)
  }
  return f
}

/**
 * map table id or name onto metadata
 *
 * mapping introduced in 1.0.3 for migration of table_name for change from name to id
 * that is in use in 1.0.0 (v1) which was at that time the production version which
 * is being migrated.
 *
 * strategy here is to test for _id first, then name as before
 *
 * @param {DTableMetadataTables} metadata
 * @param {string} sid
 * @return {DTableTable}|undefined metadata of table, undefined if no table metadata
 */
const tableFromMetadata = (metadata, sid) => {
  const s = sidParse(sid)
  const predicate = (name, property) => {
    const hop = (p) => Object.prototype.hasOwnProperty.call(s, p)
    // named identifier
    if (hop(name)) {
      return [property, s[name]]
    }
    return []
  }

  return _.find(metadata.tables, predicate('table', '_id'))
}

const isEmpty = (v) => {
  if (v === undefined) {
    return true
  }

  // noinspection LoopStatementThatDoesntLoopJS
  for (let i in v) {
    return false
  }
  return true
}

/**
 * parse seatable api sub-identifier (sid)
 *
 * parse only right now, encoding is simple string building. format definition is here.
 *
 * table:{id}     the format is not very well defined, we can see 4 characters of a-z, A-Z and 0-9.
 *                -> request of specification from Seatable, talked with MW, no feedback yet
 * column:{key}   the format is not very well defined, similar to table:{id} we can see 4 characters
 *                of a-z, A-Z and 0-9.
 * table:{id}:view:{id}
 *                the view is in context of a table as per base, views and tables can have the same
 *                ids. therefore it is not possible to identify the table via the view-id alone when
 *                there could be a table meant as well (only with an additional rule/data like prefer
 *                the more specific (view) over the less (table) which is not possible with a resource
 *                name alone, hence the hierarchy).
 * table:{id}:row:{id}
 *                table row
 *
 * NOTE: current implementation is lax on the length of id/keys, 4 is the minimum length, "_" and "-"
 *       are allowed to be by part anywhere while they were not seen in id/key (only in identifiers/keys
 *       of other entities)
 *
 * EXAMPLE:
 *
 *    sid: 'table:0000:view:0000' -> {table: '0000', view: '0000}
 *
 * NOTE: @returns empty object ({}) given the sid parameter is not a string. This is to allow hasOwnProperty
 *       checks on the result which only work with objects.
 *
 * @param sid {string}
 * @returns {({table: {string}, view?: {string}, row?: {string}}|{column: {string}}|{})} sid-object
 * @throws Error if sid is of invalid syntax
 */
const sidParse = (sid) => {
  let result = false
  if ((typeof sid === 'string' || sid instanceof String)) {
    result = sid.match(/^(table:(?<table>[a-zA-Z0-9_-]{4,})(:view:(?<view>[a-zA-Z0-9_-]{4,})|:row:(?<row>[a-zA-Z0-9_-]{4,}))?|column:(?<column>[a-zA-Z0-9_-]{4,}))$/)
  } else {
    return {}
  }

  if (!result) {
    throw new Error(`unable to parse (invalid) sid: "${sid}"`)
  }
  // noinspection JSValidateTypes
  return _.pickBy(result.groups, _.identity)
}

/**
 * request parameters for bundle
 *
 * map bundle.inputData instead of sids, see requestParamsSid
 *
 * @param bundle
 * @return {{table_id?: {string}, view_id?: {string}}}
 */
function requestParamsBundle(bundle) {
  /* @type {table_name?: string, table_view?: string} */
  const input = bundle.inputData

  // prefer more fine-grained view first
  if (input.table_view) {
    const r = requestParamsSid(input.table_view)
    // check against leading table, if any
    if (input.table_name) {
      const c = requestParamsSid(input.table_name)
      // use leading table if view is in another table
      if (c.table_id !== r.table_id) {
        return c
      }
    }
    return r
  }

  return requestParamsSid(input.table_name)
}

/**
 * request parameters for sid
 *
 * @param {string} sid
 * @return {{table_id?: {string}, view_id?: {string}}}
 */
function requestParamsSid(sid) {
  const r = {}, s = sidParse(sid);
  ['table', 'view'].forEach(x => (s[x] && (r[`${x}_id`] = s[x])))
  return r
}

/**
 * create an object w/ column key properties (column:<key> + row_id / row_mtime)
 * based on columns if column.name-ed property exists in row
 *
 * this is useful to obtain a row result guarded by the bound metadata and
 * also allows to control the columns (apart from _id and _mtime) in the
 * return object.
 *
 * @param {Array<DTableColumn>} columns
 * @param {object} row
 * @return {object} distinguished column-key mapped row
 */
const mapColumnKeys = (columns, row) => {
  const r = {}
  const hop = (a, b) => Object.prototype.hasOwnProperty.call(a, b)
  // step 1: implicit row properties
  const implicit = ['_id', '_mtime']
  for (const p of implicit) {
    if (hop(row, p)) {
      r[`row${p}`] = row[p]
    }
  }
  // step 2: column.name
  for (const c of columns) {
    if (undefined !== c.key && undefined !== c.name && hop(row, c.name)) {
      r[`column:${c.key}`] = row[c.name]
    }
  }
  return r
}

/**
 * map keys of a create row operation for output
 *
 * @param  {DTableRow} row
 */
const mapCreateRowKeys = (row) => {
  let r = {}

  for (const k in row) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) {
      continue
    }
    const v = row[k]
    if (k === '_id') {
      r[`row${k}`] = v
      continue
    }
    r[`column:${k}`] = v
  }
  return r
}

/**
 * link column meta-data
 *
 * get metadata of the table linked-to, undefined if not a link
 * column.
 *
 * @param {DTableColumn|DTableColumnTLink} col
 * @param bundle
 * @return {DTableTable}?
 */
const columnLinkTableMetadata = (col, bundle) => {
  if (col.type !== 'link'
      || undefined === col.data
      || undefined === col.data.table_id
      || undefined === col.data.other_table_id) {
    return undefined
  }
  const linkTableId = bundle_table_meta(bundle)._id === col.data.other_table_id
      ? col.data.table_id
      : col.data.other_table_id
  return _.find(bundle.dtable.metadata.tables, ['_id', linkTableId])
}

/**
 * standard output fields based on the bundled table meta-data
 *
 * (since 2.0.0) all of the rows columns with the resolution of linked rows columns (supports column.type link)
 *
 * @param {Array<DTableColumn|DTableColumnTLink>} columns (e.g. tableMetadata.columns)
 * @param bundle
 * @return {{label: string, key: string}[]}
 */
const outputFieldsRows = function* (columns, bundle) {
  for (const col of columns) {
    const f = {key: `column:${col.key}`, label: col.name}

    // link field handling
    const linkTableMetadata = columnLinkTableMetadata(col, bundle)
    if (undefined !== linkTableMetadata) {
      const children = [{key: `${f.key}[]row_id`, label: `${col.name}: ID`}, {
        key: `${f.key}[]row_mtime`,
        label: `${col.name}: Last Modified`,
      }]
      for (const c of linkTableMetadata.columns) {
        if (c.type === 'link') continue
        children.push({key: `${f.key}[]column:${c.key}`, label: `${col.name}: ${c.name}`})
      }
      f.children = children
    }

    yield f
  }
}

/**
 * table_view input dropdowns
 *
 * @param z
 * @param bundle
 * @return {Promise<{helpText: string, label: string, type: string, altersDynamicFields: boolean, key: string, required: boolean}>}
 */
const tableView = async (z, bundle) => {
  const viewIsInvalid = (
      bundle.inputData.table_name
      && bundle.inputData.table_view
      && !bundle.inputData.table_view.startsWith(`${bundle.inputData.table_name}:`)
  )

  // base configuration
  const def = {
    key: 'table_view',
    required: false,
    type: 'string',
    label: 'View',
    helpText: 'You can optionally pick a view of the table.',
    altersDynamicFields: true,
  }
  // input choices
  const choices = {}
  const tableMetadata = await acquireTableMetadata(z, bundle)
  for ({_id, name} of tableMetadata.views) {
    choices[`table:${tableMetadata._id}:view:${_id}`] = name
  }
  def.choices = choices
  // default value
  if (tableMetadata._id) {
    def.default = `table:${tableMetadata._id}:view:0000`
    bundle.inputData.table_view = def.default
    def.placeholder = `${tableMetadata.views && tableMetadata.views[0].name || 'Default View'}`
  }

  if (viewIsInvalid && tableMetadata._id) {
    def.helpText = `${def.helpText} **Note:** The default view of table **${tableMetadata.name}** above is in use. Click drop-down to select another view.`
  }

  return def
}

/**
 * table_name + table_view input dropdowns
 *
 * @param z
 * @param bundle
 * @return {Promise<Array<{helpText: string, label: string, type: string, altersDynamicFields: boolean, key: string, required: boolean}>>}
 */
const tableFields = async (z, bundle) => {
  return [
    {
      key: 'table_name',
      required: true,
      label: 'Table',
      helpText: 'Pick a SeaTable table for your new row trigger.',
      type: 'string',
      dynamic: 'get_tables_of_a_base.id.name',
      altersDynamicFields: true,
    },
    await tableView(z, bundle),
  ]
}

module.exports = {
  /**
   * @returns {Promise<DTable>}
   */
  acquireDtableAppAccess,
  acquireLinkColumnsData,
  acquireMetadata,
  acquireTableMetadata,
  filter,
  mapColumnKeys,
  mapCreateRowKeys,
  requestParamsSid,
  requestParamsBundle,
  sidParse,
  struct,
  tableFields,
  tableView,
  // standard
  outputFieldsRows,
  // noAuthLinks
  FEATURE_NO_AUTH_ASSET_LINKS,
  acquireFileNoAuthLinks,
  outputFieldsFileNoAuthLinks,
  fileNoAuthLinksField,
}
