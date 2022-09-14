const _CONST = require('./src/const')
const {ResponseThrottleInfo} = require('./src/lib')

const authentication = require('./src/authentication')
/* Trigger */
const getRowCreate = require('./src/triggers/row_create')
const getRowUpdate = require('./src/triggers/row_update')
const getRowOfATable = require('./src/triggers/get_row_of_a_table')
const getTablesOfABase = require('./src/triggers/get_tables_of_a_base')
const getViewsOfATableOfAView = require('./src/triggers/get_views_of_a_table_of_a_base')
/* Create */
const createRow = require('./src/creates/row')
const createRowUpdate = require('./src/creates/row_update')
/* Search */
const findRow = require('./src/searches/row')
const getRowIdOfATable = require('./src/searches/get_row_id_of_a_table')

const featureHttpAlwaysLogging = {
  key: _CONST.FEATURE_HTTP_MIDDLEWARE_ALWAYS_LOG_THROTTLING,
  enabled: false,
}

/* HTTP Middleware */
const handleHTTPError = (response, z) => {
  if (response.request && response.request.skipHandleHTTPError) {
    return response
  }
  if (featureHttpAlwaysLogging.enabled && response.status !== 429) {
    z && z.console.log(`handleHTTPError(${response.request.method} ${response.request.url} ${response.status} [${new ResponseThrottleInfo(response)}])`)
  }

  if (response.status < 400) {
    return response
  }
  if (response.status === 401) {
    throw new z.errors.RefreshAuthError()
  }
  if (response.status === 403) {
    throw new Error(_CONST.STRINGS['http.error.status403'])
  }
  if (response.status === 429) {
    /* @link https://zapier.github.io/zapier-platform/#handling-throttled-requests */
    const retryAfter = response.getHeader('retry-after') || 67
    z.console.log(`handleHTTPError(${new ResponseThrottleInfo(response)}) (status=${response.status} retryAfter=${retryAfter})`)
    throw new z.errors.ThrottledError(_CONST.STRINGS['http.error.status429'], retryAfter)
  }
  throw new Error(`Unexpected status code ${response.status}`)
}
const handleUndefinedJson = (response) => {
  if (response.request && response.request.skipHandleUndefinedJson) {
    return response
  }
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
