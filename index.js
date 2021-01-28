const authentication = require('./authentication')
/* Trigger */
const getRowCreate = require('./triggers/row_create')
const getRowUpdate = require('./triggers/row_update')
const getRowOfATable = require('./triggers/get_row_of_a_table')
const getTablesOfABase = require('./triggers/get_tables_of_a_base')
const getViewsOfATableOfAView = require('./triggers/get_views_of_a_table_of_a_base')
/* Create */
const createRow = require('./creates/row')
const createRowUpdate = require('./creates/row_update')
/* Search */
const findRow = require('./searches/row')
const getRowIdOfATable = require('./searches/get_row_id_of_a_table')

/* HTTP Middleware */
const handleHTTPError = (response, z) => {
  if (response.status >= 400) {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError()
    }
    if (response.status === 403) {
      throw new Error(
          '403 Forbidden: This Zap is not allowed to write data to' +
          ' SeaTable.' +
          ' Most of the time this happens if you use an API-Token with' +
          ' read-only permission.',
      )
    }
    throw new Error(`Unexpected status code ${response.status}`)
  }
  return response
}
const handleUndefinedJson = (response) => {
  let accept = undefined
  try {
    accept = response.request.headers.Accept
  } catch {
  }
  if (
      'string' === typeof accept
      && accept.match(/^($|\s*application\/json\s*($|;))/is)
      && 'undefined' === typeof response.data
  ) {
    throw new Error(`Zapier core has left JSON undefined in its response object for a request with Accept: ${accept}`)
  }
  return response
}

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,
  requestTemplate: {
    method: 'GET',
    headers: {Accept: 'application/json'},
  },
  afterResponse: [handleHTTPError, handleUndefinedJson],
  triggers: {
    [getRowCreate.key]: getRowCreate,
    [getRowUpdate.key]: getRowUpdate,
    [getRowOfATable.key]: getRowOfATable,
    [getTablesOfABase.key]: getTablesOfABase,
    [getViewsOfATableOfAView.key]: getViewsOfATableOfAView,
  },
  creates: {
    [createRow.key]: createRow,
    [createRowUpdate.key]: createRowUpdate,
  },
  searches: {
    [findRow.key]: findRow,
    [getRowIdOfATable.key]: getRowIdOfATable,
  },
  searchOrCreates: {
    [findRow.key]: {
      key: findRow.key,
      display: {
        label: 'Find Row (Search or Create)',
        description: '(intentionally left blank)',
      },
      search: findRow.key,
      create: createRow.key,
    },
  },
}
