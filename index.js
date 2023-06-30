const _CONST = require("./src/const");
const {ResponseThrottleInfo} = require("./src/lib");

const authentication = require("./src/authentication");
/* Trigger */
const fileCreate = require("./src/triggers/file_create");
const rowCreate = require("./src/triggers/row_create");
const rowUpdate = require("./src/triggers/row_update");
const getRowOfATable = require("./src/triggers/get_row_of_a_table");
const getTablesOfABase = require("./src/triggers/get_tables_of_a_base");
const getViewsOfATableOfAView = require("./src/triggers/get_views_of_a_table_of_a_base");
/* Create */
const createRow = require("./src/creates/row");
const createRowUpdate = require("./src/creates/row_update");
const createApiRequest = require("./src/creates/api_request");
/* Search */
const getmanyRowsResource = require("./src/searches/getmany_rows");
const findGetrow = require("./src/searches/getrow");
const featureHttpAlwaysLogging = {
  key: _CONST.FEATURE_HTTP_MIDDLEWARE_ALWAYS_LOG_THROTTLING,
  enabled: false,
};


/**
 * handleForbiddenBaseAccess
 *
 * 403 /api/v2.1/dtable/app-access-token/
 *
 * @param {HttpResponse|RawHttpResponse} response
 * @param {ZObject} z
 * @return {{endPointPath}|*}
 */
const handleForbiddenBaseAccess = (response, z) => {
  if (
    response?.status !== 403 ||
    !response?.request?.endPointPath ||
    response.request.endPointPath !== "/api/v2.1/dtable/app-access-token/"
  ) {
    return response;
  }

  z.console.log(`handleForbiddenBaseAccess(${response.request.method} ${response.request.url} ${response.status})`);
  throw new z.errors.ExpiredAuthError("Your API Key is invalid. Please reconnect your account.");
};

/**
 * handleDeletedBaseAccess
 *
 * 404 /api/v2.1/dtable/app-access-token/
 *  `-{"error_msg": "dtable _(deleted_12345) Deleted Table not found."}
 *
 * @param {HttpResponse|RawHttpResponse} response
 * @param {ZObject} z
 * @return {{error_msg}|{endPointPath}|*}
 */
const handleDeletedBaseAccess = (response, z) => {
  const re = /^dtable _\(deleted_(\d+)\) (.*) not found\.$/;
  let reRes;
  if (
    response?.status !== 404 ||
    !response?.request?.endPointPath ||
    response.request.endPointPath !== "/api/v2.1/dtable/app-access-token/" ||
    !response?.data?.error_msg ||
    typeof response.data.error_msg !== "string" ||
    !(reRes = response.data.error_msg.match(re))
  ) {
    return response;
  }
  // z.console.log(`handleDeletedBaseAccess(${response.request.method} ${response.request.url} ${response.status})`);
  throw new z.errors.ExpiredAuthError(`The SeaTable base ${JSON.stringify(reRes[2])} has been deleted. If deletion was unindented, restore the base from trash. If the base has moved, provide a new API-Token and reconnect the Zap.`);
};

const handleHTTPError = (response, z) => {
  if (response.request && response.request.skipHandleHTTPError) {
    return response;
  }
  if (featureHttpAlwaysLogging.enabled && response.status !== 429) {
    z && z.console.log(`handleHTTPError(${response.status} ${response.request.method} ${response.request.url} [${new ResponseThrottleInfo(response)}])`);
  }

  if (response.status < 400) {
    return response;
  }
  if (response.status === 400) { // bad request
    // link-column: wrong row_id
    if (typeof response.data.error_type !== "undefined") {
      if (response.data.error_type === "row_not_exist") {
        throw new z.errors.Error("A link could not be created: one of your row ids to create a link must be wrong.", "InvalidData", 400);
      }
    }
    let errorMessage = response.data;
    if (typeof response.data.error_msg !== "undefined") {
      errorMessage = response.data.error_msg;
    } else if (typeof response.data.error_message !== "undefined") {
      errorMessage = response.data.error_message;
    }
    // fallback: something went wrong
    throw new z.errors.Error(`Something went wrong. Please check your input data. This error message might help you: ${errorMessage}`, "InvalidData", 400);
  }
  if (response.status === 401) { // unauthorized
    throw new z.errors.RefreshAuthError();
  }
  if (response.status === 403) { // forbidden
    // No permission with this api-key (e.g. read-only)
    if (response.data.error_msg && response.data.error_msg === "You don't have permission to perform this operation on this base.") {
      throw new z.errors.Error("This Zap is not allowed to talk to SeaTable. Your API-Token might be read-only?", "Forbidden", 403);
    }
    // fallback: not allowed
    throw new z.errors.Error(`You are not allowed to do this. Please check your API-Token and re-authenticate. This error message might help you: ${response.data}`, "Forbidden", 403);
  }
  if (response.status === 404) { // not found
    throw new z.errors.Error("404 Not found. Please check if the target URL and HTTP Method is correct.", "Not found", 404);
  }
  if (response.status === 429) {
    /* @link https://zapier.github.io/zapier-platform/#handling-throttled-requests */
    const parsed = parseInt(response.getHeader("retry-after"), 10);
    const retryAfter = (Number.isSafeInteger(parsed) && parsed > 0) ? parsed : 67;
    z.console.log(`handleHTTPError(${response.status} ${response.request.method} ${response.request.url} [${new ResponseThrottleInfo(response)}]) (retryAfter=${retryAfter})`);
    throw new z.errors.ThrottledError(_CONST.STRINGS["http.error.status429"], retryAfter);
  }

  let message = response?.json?.error_msg || _CONST.STRINGS["http.error.status4xx5xxFallback"];
  message = message.charAt(0).toUpperCase().concat(message.slice(1));

  throw new Error(`${message} (${response.status})`);
};
const handleUndefinedJson = (response) => {
  if (response.request && response.request.skipHandleUndefinedJson) {
    return response;
  }
  let accept;
  try {
    accept = response.request.headers.Accept;
  } catch {
  }
  if (
    typeof accept === "string" &&
      accept.match(/^($|\s*application\/json\s*($|;))/is) &&
      typeof response.data === "undefined"
  ) {
    throw new Error(`Zapier core has left JSON undefined in its response object for a request with Accept: ${accept}`);
  }
  return response;
};

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,
  hydrators: require("./src/hydrators"),
  authentication,

  requestTemplate: {
    method: "GET",
    headers: {Accept: "application/json"},
  },

  beforeRequest: [],
  afterResponse: [handleForbiddenBaseAccess, handleDeletedBaseAccess, handleHTTPError, handleUndefinedJson],

  triggers: {
    [getRowOfATable.key]: getRowOfATable,
    [getTablesOfABase.key]: getTablesOfABase,
    [getViewsOfATableOfAView.key]: getViewsOfATableOfAView,
    [rowCreate.key]: rowCreate,
    [rowUpdate.key]: rowUpdate,
    [fileCreate.key]: fileCreate,
  },

  creates: {
    [createRow.key]: createRow,
    [createRowUpdate.key]: createRowUpdate,
    [createApiRequest.key]: createApiRequest,
  },

  searches: {
    [findGetrow.key]: findGetrow,
  },
  searchOrCreates: {
    [findGetrow.key]: {
      key: findGetrow.key,
      display: {
        label: "Find Row (Search or Create)",
        description: "(intentionally left blank)",
      },
      search: findGetrow.key,
      create: createRow.key,
    },
  },

  resources: {
    [getmanyRowsResource.key]: getmanyRowsResource,
  },

};
