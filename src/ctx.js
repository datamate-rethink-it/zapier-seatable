/*
 * seatable api context for zapier
 *
 * Written by Tom Klingenberg
 * Copyright 2021 SeaTable GmbH, Mainz
 */
// const {ZapBundle} = require('./ctx/ZapBundle');

const _CONST = require("./const");
const {stashFile} = require("./hydrators");
const _ = require("lodash");
const {ResponseThrottleInfo} = require("./lib");
const {sidParse} = require("./lib/sid");

/**
 * context bound dtable struct
 *
 * @type {{columns: {filter: {not: [string, string, string, string]}, types: {date: string, image: string, creator: string, link: string, 'auto-number': string, mtime: string, url: string, collaborator: string, duration: string, number: string, 'multiple-select': string, file: string, 'single-select': string, checkbox: string, formula: string, ctime: string, text: string, 'long-text': string, email: string, geolocation: string, 'last-modifier': string}, zapier: {hide_write: string[]}}}}
 */
const struct = {
  columns: {
    types: {
      "text": "Text",
      "long-text": "Long text",
      "number": "Number",
      "checkbox": "Checkbox",
      "date": "Date",
      "single-select": "Single select",
      "image": "Image",
      "file": "File",
      "multiple-select": "Multiple select",
      "collaborator": "Collaborator",
      "url": "URL",
      "email": "Email",
      "duration": "Duration",
      "geolocation": "Geolocation",
      "rate": "Rating",
      "formula": "Formula",
      "link-formula": "Link formula",
      "link": "Link to other records",
      "auto-number": "Auto number",
      "creator": "Creator",
      "ctime": "Created time",
      "last-modifier": "Last modifier",
      "mtime": "Last modified time",
      "button": "Button",
      "digital-sign": "Signature",
    },
    input_field_types: {
      "text": "string",
      "long-text": "text",
      "number": "number",
      "checkbox": "boolean",
      "date": "datetime",
      "single-select": "string",
      "image": "file",
      "file": "file",
      "multiple-select": "string",
      "collaborator": "string",
      "url": "string",
      "email": "string",
      "duration": "string",
      "geolocation": "string",
      "rate": "integer",
      "formula": "string",
      "link-formula": "string",
      "link": "string",
      "auto-number": "integer",
      "creator": "string",
      "ctime": "string",
      "last-modifier": "string",
      "mtime": "string",
      "button": "string",
      "digital-sign": "file",
    },
    help_text: {
      "text": "",
      "long-text": "",
      "number": "Enter any numeric value. Decimals must be separated from the integer with a period \".\"",
      "checkbox": "Allowed values are *true* and *false*.",
      "date": "Zapier tries to interpret any date or time you provide. Input like \"today\" or a timestamp are allowed.",
      "single-select": "Single select column only accepts existing options.",
      "image": "Add a picture or a public reachable URL. Only png, jpg, jpeg or gif are allowed.",
      "file": "Add a file, a public reachable URL or any string (Zapier will turn text into a .txt file and upload it)",
      "multiple-select": "Add one or multiple existings option. Separat the options from each other by a space.",
      "collaborator": "Please enter the email adress of a user. The name or the @auth.local user id will not work.",
      "url": "",
      "email": "",
      "duration": "Please enter your durations in seconds. (e.g. 9000 will be 2:30 hours)",
      "geolocation": "",
      "rate": "Rating column accepts whole number values.",
      "formula": "",
      "link-formula": "",
      "link": "Please enter the row id of the target row.",
      "auto-number": "",
      "creator": "",
      "ctime": "",
      "last-modifier": "",
      "mtime": "",
      "button": "",
      "digital-sign": "",
    },
    assets: ["file", "image"],
    filter: {
      // column types that can not be filtered:
      not: ["file", "image", "long-text", "url"],
    },
    zapier: {
      // column types that zapier must not write/create (hidden):
      hide_write: [
        "auto-number",
        "ctime",
        "mtime",
        "formula",
        "link-formula",
        "creator",
        "last-modifier",
        "button",
        "digital-sign",
      ],
      // column types that zapier should not offer to search in (hidden):
      hide_search: ["link", "formula", "button", "multiple-select", "checkbox", "digital-sign"],
      /**
       * column types that zapier offers for a row-lookup
       * @type {DTableColumnType[]}
       */
      row_lookup: ["text", "number", "date", "url", "email", "auto-number"],
      // column types that zapier shows for file/image uploads (assets):
      show_file: ["file", "image"],
    },
  },
};

/**
 * zap initializer hook for bundle in ctx
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {string} bundle rolling transaction id
 */
function zapInitHookBundle(z, bundle) {
  if (bundle.__zTS) {
    return bundle.__zTS;
  }

  /**
   * bundle init start time
   *
   * @type {number} of milliseconds since 1 January 1970 00:00:00 UTC
   */
  bundle.__zT = new Date().valueOf();

  /**
   * bundle rolling transaction id
   *
   * @type {string} 6-character width flake of the bundle transaction
   */
  bundle.__zTS = "".concat(String(bundle.__zT % 1000000)).padStart(6, " ");

  /**
   * bundle zap log-tag
   *
   * @type {string} zap log-tag "[<z-ts>] zap", always 12 characters
   */
  bundle.__zLogTag = `[${bundle.__zTS}] zap`;
  // z.console.time(bundle.__zLogTag);

  return bundle.__zTS;
}

/**
 * zap initializer in ctx
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {string}
 */
function zapInit(z, bundle) {
  // remove trailing slash (common user input error)
  bundle.authData.server = bundle.authData.server.replace(/\/+$/, "");

  return zapInitHookBundle(z, bundle);
}

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{}>}
 */
async function serverInfo(z, bundle) {
  zapInit(z, bundle);

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/server-info/`,
    skipHandleHTTPError: true,
    skipHandleUndefinedJson: true,
    skipThrowForStatus: true,
  });

  const serverInfo = {
    server: `${bundle.authData.server}`,
  };
  const properties = (response.data && Object.keys(response.data)) || [];
  properties.forEach(function(property) {
    const value = response.data[property];
    if (typeof value === "string") {
      serverInfo[property] = value;
    }
  });
  if (!~properties.indexOf("version") || !~properties.indexOf("edition")) {
    throw new Error(
        _CONST.STRINGS["seatable.error.no-server-info"](bundle.authData.server),
    );
  }

  return (bundle.serverInfo = serverInfo);
}

/**
 * bind serverInfo in bundle
 *
 * point of first contact with the remote system
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<DTable>}
 */
const acquireServerInfo = (z, bundle) => {
  return isEmpty(bundle.serverInfo) ?
    serverInfo(z, bundle) :
    Promise.resolve(bundle.serverInfo);
};

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<DTable>}
 */
async function appAccessToken(z, bundle) {
  await acquireServerInfo(z, bundle);

  /** @type {ZapierZRequestResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
    headers: {Authorization: `Token ${bundle.authData.api_token}`},
    endPointPath: "/api/v2.1/dtable/app-access-token/",
  });

  const dtable = {server_address: bundle.authData.server};
  const properties = (response.data && Object.keys(response.data)) || [];
  for (const property of properties) {
    dtable[property] = response.data[property];
  }
  const serverInfo = bundle.serverInfo;
  z.console.timeLog(
      bundle.__zLogTag,
      `app(${dtable.workspace_id}/${dtable.dtable_uuid}) ${serverInfo.version} ${serverInfo.edition} (${bundle.authData.server})`,
  );
  if (
    !~properties.indexOf("dtable_uuid") ||
    !~properties.indexOf("access_token")
  ) {
    throw new Error(
        _CONST.STRINGS["seatable.error.app-access-token"](bundle.authData.server),
    );
  }
  bundle.dtable = dtable;

  return bundle.dtable;
}

/**
 * bind dtable in bundle
 *
 * does authentication via appAccessToken()
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<DTable>}
 */
const acquireDtableAppAccess = (z, bundle) => {
  return isEmpty(bundle.dtable) ?
    appAccessToken(z, bundle) :
    Promise.resolve(bundle.dtable);
};

const featureLinkColumnsData = {
  enabled: true, // whether data of linked columns are fetched (2.1.0: true)
  childLimit: 1, // number of children (linked rows) per source row.column that are resolved (2.1.0: 1)
  resolveLimit: 10, // number of total resolves that are done
};

/**
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @return {Array<DTableColumn|DTableColumnTLink>}
 */
/*
const fileColumns = (columns) =>
  columns.filter((s) => struct.columns.assets.indexOf(s.type) + 1);
// const noAuthColumnKey = (key) => `column:${key}-(no-auth-dl)`;
// const noAuthColumnLabel = (name) => `${name} (Download w/o Authorization)`;
const noAuthFilePathFromUrl = (buffer) => {
  // 'https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg'
  const probe = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(buffer);
  return probe && probe[1];
};
*/

const fileNoAuthLinksField = {
  key: _CONST.FEATURE_NO_AUTH_ASSET_LINKS,
  required: false,
  default: "False",
  type: "boolean",
  label: "Provide access to images and files",
  helpText:
    "**False:** You get only *internal links* to your files and images that require an authentication and therefore can not be used in your Zapier actions. Still you get access to the metadata of your files. **True:** You get access to your files and images. SeaTable also creates public download links (valid for a few hours). This requires additional API calls, so the [limits](https://api.seatable.io/reference/limits) may be exhausted earlier.",
  altersDynamicFields: false,
};


/**
 * add non-authorized asset links into the result
 * BRAUCHE ICH DAS ÜBERHAUPT NOCH???
 *
 * images and files, original data type (string or object) is kept, ads a new, suffixed entry.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @param {Array<{object}>} rows
 */
/*
const acquireFileNoAuthLinks = async (z, bundle, columns, rows) => {
  if (!bundle.inputData[_CONST.FEATURE_NO_AUTH_ASSET_LINKS]) {
    return rows;
  }

  const logTag = `[${bundle.__zTS}] acquireFileNoAuthLinks`;
  z.console.time(logTag);

  const dtableCtx = bundle.dtable;
  const fileUrlStats = {urls: [], errors: []};
  const fileUrl = async (buffer) => {
    fileUrlStats.urls.push(buffer);
    const urlPath = noAuthFilePathFromUrl(buffer);
    if (!urlPath) {
      throw new z.errors.Error(`Failed to extract path from url: "${buffer}"`);
    }
    /** @type {ZapierZRequestResponse} */
/* let response;
    let exception;
    const url = `${bundle.authData.server}/api/v2.1/dtable/app-download-link/?path=${urlPath}`;
    try {
      response = await z.request({
        url,
        headers: {Authorization: `Token ${bundle.authData.api_token}`},
        skipThrowForStatus: true,
      });
    } catch (e) {
      exception = e;
    }
    if (!_.isObject(response && response.data)) {
      if (_.isObject(exception) && exception.name === 'ThrottledError') {
        throw exception;
      }
      fileUrlStats.errors.push([
        buffer,
        urlPath,
        url,
        response,
        exception && exception.message,
      ]);
      return null;
    }
    return response.data.download_link || null;
  };
  rows = await Promise.all(
      rows.map(async (row) => {
        for (const column of fileColumns(columns)) {
          const field = `column:${column.key}`;
          const noAuthField = noAuthColumnKey(column.key);
          const values = row && row[field];
          if (!values) continue;
          if (!Array.isArray(values)) continue;
          if (!values.length) continue;
          if (fileUrlStats.errors.length > 0) {
          // skip further urls on error
            z.console.timeLog(logTag, `skipping on previous error`);
            row[noAuthField] = null;
            continue;
          }
          row[noAuthField] = await Promise.all(
              values.map(async (value) => {
                if (
                  typeof value === 'object' &&
              value !== null &&
              value.type === 'file' &&
              value.url
                ) {
                  const copy = {...value};
                  copy.url = await fileUrl(value.url);
                  return copy;
                } else if (typeof value === 'string' && value) {
                  return await fileUrl(value);
                }
                return value;
              }),
          );
        }
        return row;
      }),
  );
  z.console.timeLog(
      logTag,
      `urls: ${fileUrlStats.urls.length} (errors: ${fileUrlStats.errors.length})`,
  );
  if (fileUrlStats.errors.length > 0) {
    z.console.timeLog(logTag, 'errors:', fileUrlStats.errors);
  }
  return rows;
};
*/

/**
 * replace column.type link references with row-data in rows (noch in entstehung.)
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 */
/*
const acquireLinkColumnsDataNEU = async (z, bundle, rowIds) => {
  const dtableCtx = bundle.dtable;

  // ich muss durch die rows nicht loopen...
  for (let i = 0, l = rowIds.length; i < l; i++) {
    const rowId = rowIds[i];

    // wo kriege ich die metadata her? übergeben??

    /** @type {ZapierZRequestResponse} */
/*
    const response = await z.request({
      url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/${rowId}/`,
      headers: {Authorization: `Token ${dtableCtx.access_token}`},
      params: {table_id: linkTableMetadata._id},
    });
    if (!_.isObject(response.data)) {
      throw new z.errors.Error(
          `Failed to retrieve table:${linkTableMetadata._id}:row:${rowId}`,
      );
    }

    /* const childRow = mapColumnKeys(
        _.filter(linkTableMetadata.columns, (c) => c.type !== 'link'),
        response.data,
    );*/

// irgendwie die response loopen und zurückgeben!
/*
    return {name: filename, size: 0, type: "image", url: o};
  }
};
*/

/*
    // handle each link field (if any)

    // ich muss auch nicht die columns loopen...
    for (const o of columns) {
      const linkTableMetadata = columnLinkTableMetadata(o, bundle);
      if (undefined === linkTableMetadata) {
        continue;
      }
      const childIds = row[`column:${o.key}`];
      if (!Array.isArray(childIds)) {
        continue;
      }
      childIds.length = Math.min(
          featureLinkColumnsData.childLimit,
          childIds.length,
      );

      const children = [];
      for (const childId of childIds) {
        const linkTableCache = linkCache(linkTableMetadata._id);
        const probe = linkTableCache.get(childId);
        if (probe) {
          children.push(probe);
          continue;
        }

        const response = await z.request({
          url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/${childId}/`,
          headers: {Authorization: `Token ${dtableCtx.access_token}`},
          params: {table_id: linkTableMetadata._id},
        });
        if (!_.isObject(response.data)) {
          throw new z.errors.Error(
              `Failed to retrieve table:${linkTableMetadata._id}:row:${childId}`,
          );
        }
        const childRow = mapColumnKeys(
            _.filter(linkTableMetadata.columns, (c) => c.type !== 'link'),
            response.data,
        );

        linkTableCache.set(childId, childRow);
        children.push(childRow);
      }

      if (children.length) {
        rows[i][`column:${o.key}`] = children;
      } else {
        delete rows[i][`column:${o.key}`]; // remove parent key as it has no children
      }
    }
  }
  return row
  */


/**
 * replace column.type link references with row-data in rows
 *
 * for the first reference-id if any
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @param {Array<{object}>} rows
 */
const acquireLinkColumnsData = async (z, bundle, columns, rows) => {
  const dtableCtx = bundle.dtable;

  if (0 === rows.length) {
    return rows;
  }

  const logTag = `[${bundle.__zTS}] acquireLinkColumnsData`;
  z.console.time(logTag);

  let totalRequestCount = 0;

  const linkMap = new Map();
  const mapMap = (m) => (a) => m.get(a) || m.set(a, new Map()).get(a);
  const linkCache = mapMap(linkMap);

  for (let i = 0, l = rows.length; i < l; i++) {
    const row = rows[i];
    // handle each link field (if any)
    for (const o of columns) {
      const linkTableMetadata = columnLinkTableMetadata(o, bundle);
      if (undefined === linkTableMetadata) {
        continue;
      }
      const childIds = row[`column:${o.key}`];
      if (!Array.isArray(childIds)) {
        continue;
      }
      childIds.length = Math.min(
          featureLinkColumnsData.childLimit,
          childIds.length,
      );

      const children = [];
      for (const childId of childIds) {
        const linkTableCache = linkCache(linkTableMetadata._id);
        const probe = linkTableCache.get(childId);
        if (probe) {
          children.push(probe);
          continue;
        }

        totalRequestCount++;
        /** @type {ZapierZRequestResponse} */
        const response = await z.request({
          url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/${childId}/`,
          headers: {Authorization: `Token ${dtableCtx.access_token}`},
          params: {table_id: linkTableMetadata._id},
        });
        if (!_.isObject(response.data)) {
          throw new z.errors.Error(
              `Failed to retrieve table:${linkTableMetadata._id}:row:${childId}`,
          );
        }
        const childRow = mapColumnKeys(
            _.filter(linkTableMetadata.columns, (c) => c.type !== "link"),
            response.data,
        );
        z.console.timeLog(
            logTag,
            `child row(${new ResponseThrottleInfo(response)}): ${
              linkTableMetadata._id
            }:row:${childId} (request=${totalRequestCount})`,
        );
        linkTableCache.set(childId, childRow);
        children.push(childRow);
      }

      if (children.length) {
        rows[i][`column:${o.key}`] = children;
      } else {
        delete rows[i][`column:${o.key}`]; // remove parent key as it has no children
      }
    }
  }

  totalRequestCount &&
    z.console.timeLog(
        logTag,
        `requests=${totalRequestCount} rows=${rows.length}`,
    );

  return rows;
};

/**
 * helper function to fetch dtable metadata
 *
 * if the bundle.dtable.metadata entry is undefined, set it with the metadata
 * from the dtables api.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<DTableMetadataTables>}
 */
const acquireMetadata = async (z, bundle) => {
  /** @type {DTable} */
  const dtableCtx = await module.exports.acquireDtableAppAccess(z, bundle);
  if (undefined !== dtableCtx.metadata) {
    return dtableCtx.metadata;
  }

  /** @type {DTableMetadataResponse} */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/metadata/`,
    headers: {
      "Authorization": `Token ${dtableCtx.access_token}`,
      "X-TABLE": bundle.inputData.table_name,
    },
  });

  bundle.dtable.metadata = response.data.metadata;
  return response.data.metadata;
};

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
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<DTableTable>}
 */
const acquireTableMetadata = async (z, bundle) => {
  const metadata = await acquireMetadata(z, bundle);
  if (!bundle?.inputData?.table_name) {
    return {
      _id: undefined,
      name: undefined,
      columns: [],
      views: [],
    };
  }
  const tableMetadata = tableFromMetadata(
      metadata,
      bundle.inputData.table_name,
  );
  if (!tableMetadata) {
    z.console.log(
        `[${bundle.__zTS}] internal: acquireTableMetadata: missing table metadata columns on input-data:`,
        bundle.inputData,
    );
  }
  return tableMetadata;
};

/**
 * get table metadata from bundle input (table_name) and out of it
 *
 * NOTE: for this function to work, the bundle must already be bound to a dtable
 *       and its meta-data.
 *
 * @param {Bundle} bundle
 * @return {DTableTable}
 */
function bundleTableMeta(bundle) {
  if (!bundle.dtable) {
    throw new Error("internal error: dtable not bundled");
  }
  const dtableCtx = bundle.dtable;
  if (!dtableCtx.metadata) {
    throw new Error("internal error: metadata bindings missing");
  }
  return tableFromMetadata(dtableCtx.metadata, bundle.inputData.table_name);
}

/**
 * row filter
 *
 * dtable metadata to row filter in z, bundle context
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {string} context label for logging
 * @return {Promise<{filter_predicate: string, filter_term: string, column_name: null, filter_term_modifier: string}>}
 */
const filter = async (z, bundle, context) => {
  const f = {
    column_name: null,
    filter_predicate: "contains",
    filter_term: bundle.inputData.search_value,
    filter_term_modifier: "",
  };
  const tableMetadata = await acquireTableMetadata(z, bundle);
  const sid = sidParse(bundle.inputData.search_column);
  const col = _.find(tableMetadata.columns, ["key", sid.column]);
  if (undefined === col) {
    z.console.log(
        `[${bundle.__zTS}] filter[${context}]: search column not found:`,
        bundle.inputData.search_column,
        sid,
        tableMetadata.columns,
    );
    return f;
  }
  if (struct.columns.filter.not.includes(col.type)) {
    z.console.log(
        `[${bundle.__zTS}] filter[${context}]: known unsupported column type (user will see an error with clear description):`,
        col.type,
    );
    throw new z.errors.Error(
        `Search in ${
          struct.columns.types[col.type] || `[${col.type}]`
        } field named "${
          col.name
        }" is not supported, please choose a different column.`,
    );
  }
  f.column_name = col.name;
  switch (col.type) {
    case "text":
    case "formula":
      break;
    case "number":
      f.filter_predicate = "equal";
      break;
    case "auto-number":
    case "checkbox":
    case "single-select":
    case "date":
    case "ctime":
    case "mtime":
      f.filter_predicate = "is";
      break;
    case "multi-select":
      f.filter_predicate = "has_any_of";
      f.filter_term = [f.filter_term];
      break;
    case "creator":
    case "last-modifier":
      f.filter_term = [f.filter_term];
      break;
    default:
      z.console.log(
          `[${bundle.__zTS}] filter[${context}]: unknown column type (fall-through):`,
          col.type,
      );
  }
  return f;
};

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
  const s = sidParse(sid);
  const predicate = (name, property) => {
    const hop = (p) => Object.prototype.hasOwnProperty.call(s, p);
    // named identifier
    if (hop(name)) {
      return [property, s[name]];
    }
    return [];
  };

  return _.find(metadata.tables, predicate("table", "_id"));
};

const isEmpty = (v) => {
  if (v === undefined) {
    return true;
  }

  for (const i in v) {
    if ({}.hasOwnProperty.call(v, i)) {
      return false;
    }
  }
  return true;
};

/**
 * request parameters for bundle
 *
 * map bundle.inputData instead of sids, see requestParamsSid
 *
 * @param {Bundle} bundle
 * @return {{table_id: string?, view_id: string?}}
 */
function requestParamsBundle(bundle) {
  /* @type {table_name?: string, table_view?: string} */
  const input = bundle.inputData;

  // prefer more fine-grained view first
  if (input.table_view) {
    const r = requestParamsSid(input.table_view);
    // check against leading table, if any
    if (input.table_name) {
      const c = requestParamsSid(input.table_name);
      // use leading table if view is in another table
      if (c.table_id !== r.table_id) {
        return c;
      }
    }
    return r;
  }

  return requestParamsSid(input.table_name);
}

/**
 * request parameters for sid
 *
 * @param {string} sid
 * @return {{table_id: string?, view_id: string?}}
 */
function requestParamsSid(sid) {
  const r = {};
  const s = sidParse(sid);
  ["table", "view"].forEach((x) => s[x] && (r[`${x}_id`] = s[x]));
  return r;
}

/**
 * create an object w/ column key properties (column:<key> + row_id / row_mtime)
 * based on columns if column.name-ed property exists in row
 *
 * this is useful to obtain a row result guarded by the bound metadata and
 * also allows to control the columns (apart from _id and _mtime) in the
 * return object.
 *
 * doppeltes return ????
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {object} URL
 * @return {object} distinguished column-key mapped row
 */
const downloadLink = async (z, bundle, URL) => {
  const dataFile = [];
  for (const file of URL) {
    const fileUrl = file.url;
    const urlPath = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(
        fileUrl,
    )?.[1];
    if (!urlPath) {
      dataFile.push(fileUrl);
      return dataFile;
      // throw new z.errors.Error(`Failed to extract path from url '${fileUrl}'`);
    }
    const collaborator = await z.request({
      url: `${bundle.authData.server}/api/v2.1/dtable/app-download-link/?path=${urlPath}`,
      method: "GET",
      headers: {Authorization: `Token ${bundle.authData.api_token}`},
    });
    const data = collaborator.json;
    if (!data.download_link) {
      throw new z.errors.Error(
          `Failed to obtain asset download link for path '${urlPath}' of url '${fileUrl}'`,
      );
    }
    const downloadedUrl = data.download_link;
    const hydratedUrl = z.dehydrateFile(stashFile, {
      downloadUrl: downloadedUrl,
    });
    return hydratedUrl;
  }
  return dataFile;
};


const downloadImageLink = async (z, bundle, URL) => {
  const dataFile = [];
  for (const file of URL) {
    const fileUrl = file;
    const urlPath = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(
        fileUrl,
    )?.[1];
    if (!urlPath) {
      dataFile.push(fileUrl);
      return dataFile;
      // throw new z.errors.Error(`Failed to extract path from url '${fileUrl}'`);
    }
    const collaborator = await z.request({
      url: `${bundle.authData.server}/api/v2.1/dtable/app-download-link/?path=${urlPath}`,
      method: "GET",
      headers: {Authorization: `Token ${bundle.authData.api_token}`},
    });
    const data = collaborator.json;
    if (!data.download_link) {
      throw new z.errors.Error(
          `Failed to obtain asset download link for path '${urlPath}' of url '${fileUrl}'`,
      );
    }
    const downloadedUrl = data.download_link;
    const hydratedUrl = z.dehydrateFile(stashFile, {
      downloadUrl: downloadedUrl,
    });
    return hydratedUrl;
  }
  return dataFile;
};

const mapColumnKeys = async (z, bundle, columns, row) => {
  const r = {};
  const hop = (a, b) => Object.prototype.hasOwnProperty.call(a, b);

  // step 1: implicit row properties
  // (_id becomes row_id, _mtime becomes row_mtime)
  const implicit = ["_id", "_mtime"];
  for (const p of implicit) {
    if (hop(row, p)) {
      r[`row${p}`] = row[p];
    }
  }

  // step 2: column.name
  // Name becomes column:8hzP
  // _ctime becomes: column:_ctime
  for (const c of columns) {
    if (undefined !== c.key && undefined !== c.name && hop(row, c.name)) {
      const regex = /^\w{32}@auth\.local$/;
      const v = row[c.name];

      // Collaborator
      if (regex.test(v[0])) {
        r[`column:${c.key}`] = await getCollaboratorData(z, bundle, v);
        continue;
      }

      // Creator + Modifier   // hier doppelte Abfrage der User-Liste -> vermeiden!
      if (regex.test(v)) {
        r[`column:${c.key}`] = await getCollaboratorData(z, bundle, [v]);
        continue;
      }

      // Files
      if ("file" === c.type) {
        if (bundle.inputData.feature_non_authorized_asset_downloads) { // get public access
          v[0].asset = await downloadLink(z, bundle, v);
        }
        r[`column:${c.key}`] = v;
        continue;
      }

      // MISSING: HANDLING OF MULTIPLE IMAGES! Split ...
      // anders als bei files. dort habe ich schon zwei objekte. BEi images habe ich alles in einem

      // Image
      if ("image" === c.type) {
        // const o = v; // getImageData expects o ?!?
        xx = getImageData(v);
        if (bundle.inputData.feature_non_authorized_asset_downloads) { // get public access
          xx[0].asset = await downloadImageLink(z, bundle, v);
        }
        r[`column:${c.key}`] = xx;
        continue;
      }

      // get values from links
      /* if ('link' === c.type) {
        z.console.log("das ist link spalte", v);
        r[`column:${c.key}`] = row[c.name];
        //r[`column:${c.key}`] = await ctx.acquireLinkColumnsData(z, bundle, tableMetadata.columns, rows);
        continue;
      }*/

      // all other columns
      r[`column:${c.key}`] = row[c.name];
    }
  }
  return r;
};

const mapColumnKeysRow = async (columns, row) => {
  const r = {};
  const hop = (a, b) => Object.prototype.hasOwnProperty.call(a, b);
  // step 1: implicit row properties
  const implicit = ["_id", "_mtime"];
  for (const p of implicit) {
    if (hop(row, p)) {
      r[`row${p}`] = row[p];
    }
  }
  // step 2: column.name
  for (const c of columns) {
    if (undefined !== c.key && undefined !== c.name && hop(row, c.name)) {
      r[`column:${c.key}`] = row[c.name];
    }
  }
  return r;
};

/**
 * map keys of a create row operation for output
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param  {DTableRow} row
 * @return {Object.<string,any>}
 */
const mapCreateRowKeys = async (z, bundle, row) => {
  const r = {};

  for (const k in row) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) {
      continue;
    }
    const regex = /^\w{32}@auth\.local$/;
    const v = row[k];
    if (regex.test(v)) {
      r[`row${k}`] = await getCollaboratorData(z, bundle, v);
      continue;
    }

    if (k === "_id") {
      r[`row${k}`] = v;
      continue;
    }
    r[`column:${k}`] = v;
  }
  return r;
};

/**
 * link column meta-data
 *
 * get metadata of the table linked-to, undefined if not a link
 * column.
 *
 * @param {DTableColumn|DTableColumnTLink} col
 * @param {Bundle} bundle
 * @return {DTableTable}?
 */
const columnLinkTableMetadata = (col, bundle) => {
  if (
    col.type !== "link" ||
    undefined === col.data ||
    undefined === col.data.table_id ||
    undefined === col.data.other_table_id
  ) {
    return undefined;
  }
  const linkTableId =
    bundleTableMeta(bundle)._id === col.data.other_table_id ?
      col.data.table_id :
      col.data.other_table_id;
  return _.find(bundle.dtable.metadata.tables, ["_id", linkTableId]);
};

/**
 * standard output fields based on the bundled table meta-data
 *
 * (since 2.0.0) all the rows columns with the resolution of linked rows columns (supports column.type link)
 * (since 3.0.0) enhanced mapping for collaborator column
 *
 * @generator
 * @param {Array<DTableColumn|DTableColumnTLink>} columns (e.g. tableMetadata.columns)
 * @param {Bundle} bundle
 * @yields {{label: string, key: string}[]}
 */
const outputFieldsRows = function* (columns, bundle) {
  for (const col of columns) {
    const f = {key: `column:${col.key}`, label: col.name};
    // generates normal label list...

    if ( col.type === "collaborator") {
      const children = [
        {key: `${f.key}[]name`, label: `${col.name}: Name`},
        {key: `${f.key}[]username`, label: `${col.name}: Username`},
        {key: `${f.key}[]email`, label: `${col.name}: Email`},
      ];
      f.children = children;
    }

    if ( col.type === "button") {
      continue;
    }

    if ( col.type === "geolocation") {
      yield {key: `${f.key}__lat`, label: `${col.name}: Latitude`};
      yield {key: `${f.key}__lng`, label: `${col.name}: Longitude`};
      continue;
    }

    if ( col.type === "file" || col.type === "image" ) {
      const children = [
        {key: `${f.key}[]name`, label: `${col.name}: File name`},
        {key: `${f.key}[]size`, label: `${col.name}: File size`},
        {key: `${f.key}[]type`, label: `${col.name}: File type`},
        {key: `${f.key}[]url`, label: `${col.name}: File URL`},
        {key: `${f.key}[]asset`, label: `${col.name}: File (temp. available)`},
      ];
      f.children = children;
    }

    if ( col.type === "digital-sign" ) {
      yield {key: `${f.key}__sign_time`, label: `${col.name}: Username`};
      yield {key: `${f.key}__sign_image_url`, label: `${col.name}: Signature image URL`};
      yield {key: `${f.key}__username`, label: `${col.name}: Username`};
      continue;
    }

    // unten durch das hier ersetzen...
    if ( col.type === "link") {
    }

    // link field handling
    /*
    const linkTableMetadata = columnLinkTableMetadata(col, bundle);
    if (undefined !== linkTableMetadata) {
      const children = [
        {key: `${f.key}[]row_id`, label: `${col.name}: ID`},
        {key: `${f.key}[]row_mtime`, label: `${col.name}: Last Modified`,},
      ];
      for (const c of linkTableMetadata.columns) {
        if (c.type === 'link') continue;
        children.push({
          key: `${f.key}[]column:${c.key}`,
          label: `${col.name}: ${c.name}`,
        });
      }
      f.children = children;
    }*/

    yield f;
  }
};

/**
 * table_view input dropdowns
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{helpText: string, label: string, type: string, altersDynamicFields: boolean, key: string, required: boolean}>}
 */
const tableView = async (z, bundle) => {
  const viewIsInvalid =
    bundle.inputData.table_name &&
    bundle.inputData.table_view &&
    !bundle.inputData.table_view.startsWith(`${bundle.inputData.table_name}:`);

  // base configuration
  const def = {
    key: "table_view",
    required: false,
    type: "string",
    label: "View",
    helpText: "You can optionally pick a view of the table.",
    altersDynamicFields: true,
  };
  // input choices
  const choices = {};
  const tableMetadata = await acquireTableMetadata(z, bundle);
  for ({_id, name} of tableMetadata.views) {
    choices[`table:${tableMetadata._id}:view:${_id}`] = name;
  }
  def.choices = choices;
  // default value
  if (tableMetadata._id) {
    def.default = `table:${tableMetadata._id}:view:0000`;
    bundle.inputData.table_view = def.default;
    def.placeholder = `${
      (tableMetadata.views && tableMetadata.views[0].name) || "Default View"
    }`;
  }

  if (viewIsInvalid && tableMetadata._id) {
    def.helpText = `${def.helpText} **Note:** The default view of table **${tableMetadata.name}** above is in use. Click drop-down to select another view.`;
  }

  return def;
};

/**
 * table_name + table_view input dropdowns
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{helpText: string, label: string, type: string, altersDynamicFields: boolean, key: string, required: boolean}>>}
 */
const tableFields = async (z, bundle) => {
  return [
    {
      key: "table_name",
      required: true,
      label: "Table",
      helpText: "Pick a SeaTable table for your new row trigger.",
      type: "string",
      dynamic: "get_tables_of_a_base.id.name",
      altersDynamicFields: true,
    },
    await tableView(z, bundle),
  ];
};

const tableNameId = async (z, bundle, context) => {
  const tableId = bundle.inputData.table_name;
  const newTableId = tableId.split(":");
  const tableIdOne = newTableId[1];
  let colName = "";
  let tableName = "";
  // const colType = "";
  const MetaData = await acquireMetadata(z, bundle);
  const tableMetadata = await acquireTableMetadata(z, bundle);
  const sid = sidParse(bundle.inputData.search_column);
  const col = _.find(tableMetadata.columns, ["key", sid.column]);
  if (undefined === col) {
    z.console.log(
        `[${bundle.__zTS}] filter[${context}]: search column not found:`,
        bundle.inputData.search_column,
        sid,
        tableMetadata.columns,
    );
    return f;
  }
  if (struct.columns.filter.not.includes(col.type)) {
    z.console.log(
        `[${bundle.__zTS}] filter[${context}]: known unsupported column type (user will see an error with clear description):`,
        col.type,
    );
    throw new z.errors.Error(
        `Search in ${
          struct.columns.types[col.type] || `[${col.type}]`
        } field named "${
          col.name
        }" is not supported, please choose a different column.`,
    );
  }
  // colType = col.type;
  colName = col.name;
  const tb = _.map(
      _.filter(MetaData.tables, (table) => {
      // console.log(table);
        return table._id === tableIdOne;
      }),
      (tableObject) => {
        return tableObject.name;
      },
  );
  tableName = tb[0];
  // const query = colType==="Text"?`${colName} = "${bundle.inputData.search_value}"`:`${colName} = ${bundle.inputData.search_value}`;

  if (bundle.inputData.search_wildcards) {
    z.console.log("DEBUG search_wildcards on", bundle.inputData.search_wildcards);
    return {
      sql: `SELECT * FROM ${tableName} WHERE ${colName} LIKE "%${bundle.inputData.search_value}%" LIMIT 10`,
      convert_keys: true,
    };
  } else {
    z.console.log("DEBUG search_wildcards off", bundle.inputData.search_wildcards);
    return {
      sql: `SELECT * FROM ${tableName} WHERE ${colName} = "${bundle.inputData.search_value}" LIMIT 10`,
      convert_keys: true,
    };
  }
};

/**
 * value = real email adress.
 */
const getCollaborator = async (z, bundle, value) => {
  const collaboratorEmail = value;
  const collaborator = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/related-users/`,
    method: "GET",
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
  });
  const collaboratorData = collaborator.json.user_list;
  const collData = _.map(
      _.filter(collaboratorData, (o) => {
        return o.contact_email === collaboratorEmail;
      }),
      (o) => {
        return o.email;
      },
  );
  return collData;
};

const getCollaboratorData = async (z, bundle, value) => {
  const collaboratorUsers = value;
  const collaborator = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/related-users/`,
    method: "GET",
    headers: {Authorization: `Token ${bundle.dtable.access_token}`},
  });
  const collaboratorData = collaborator.json.user_list;
  const collData = _.map(
      _.filter(collaboratorData, (o) => {
        const regex = /^\w{32}@auth\.local$/;
        for (let i = 0; i < collaboratorUsers.length; i++) {
          if (
            o.email === collaboratorUsers[i] &&
          regex.test(collaboratorUsers[i])
          ) {
            return o.email === collaboratorUsers[i];
          }
        }
      }),
      (o) => {
        return {username: o.email, email: o.contact_email, name: o.name};
      },
  );
  return collData;
};

// diese pauschale suche funktioniert nicht, weil er dann die erstbeste findet!
// diese funktion erzeugt die bodyData für den tatsächlichen request.
//

const linkRecord = async (z, bundle, key, col) => {
  // get metadata
  const metadata = await acquireMetadata(z, bundle);
  const data = metadata.tables;
  const TablesData = _.map(data, (o) => {
    return {_id: o._id, name: o.name};
  });

  // prepare bodyData for api request
  const bodyData = {
    link_id: col.data.link_id,
    table_row_id: bundle.inputData?.["table_row"],
    table_id: col.data.table_id,
    other_table_id: col.data.other_table_id,
    other_table_row_id: bundle.inputData?.[key],
  };
  // enhance with table names from table ids.
  _.map(TablesData, (o) => {
    if (bodyData.table_id === o._id) {
      bodyData.table_name = o.name;
    }
    if (bodyData.other_table_id === o._id) {
      bodyData.other_table_name = o.name;
    }
  });
  z.console.log("DEBUG linkTwoRecord bodyData", bodyData);
  return await linkRequest(z, bundle, bodyData);
};

// funktioniert mit dem richtigen input
const linkRequest = async (z, bundle, bodyData) => {
  const linkTwoRecord = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/links/`,
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "Authorization": `Token ${bundle.dtable.access_token}`,
    },
    body: JSON.stringify({
      table_name: bodyData.table_name,
      other_table_name: bodyData.other_table_name,
      link_id: bodyData.link_id,
      table_row_id: bodyData.table_row_id,
      other_table_row_id: bodyData.other_table_row_id,
    }),
  });
  return linkTwoRecord;
};

// from [https://stage.seatable.io/workspace/224/asset/c392d08d-5b00-4456-9217-2afb89e07a0c/images/2023-06/zapier-build.png] to an object with name, type, size and url
// enhances the image data with more information.
//
const getImageData = (value) => {
  const Images = value;
  const imageData = _.map(Images, (o) => {
    const regex = /([^/]+)$/;
    const match = o.match(regex);
    const filename = match[1];
    return {name: filename, size: 0, type: "image", url: o};
  });
  return imageData;
};

const getCollAndImage = async (z, bundle, value) => {
  const Data = value;
  const newArray = _.map(Data, async (o) => {
    o.Image = getImageData(o.Image);
    o.Collaborator = await getCollaboratorData(z, bundle, o.Collaborator);
    return o;
  });
  return newArray;
};

/**
 * get table columns as bundled
 * take view into account if available & valid
 *
 * if table or view metadata is not available for table_name / table_view (alt: default view)
 * the columns parameter falls through.
 *
 * @param {Array<DTableColumn>} columns
 * @param {Bundle} bundle
 * @return {Array<DTableColumn>}
 */
const getBundledViewColumns = (columns, bundle) => {
  const viewIsInvalid = (
    bundle.inputData.table_name &&
      bundle.inputData.table_view &&
      !bundle.inputData.table_view.startsWith(`${bundle.inputData.table_name}:`)
  );
  const tid = sidParse(bundle.inputData.table_name).table;
  /** @type DTableTable */
  const table = _.find(bundle.dtable.metadata.tables, ["_id", tid]);
  if (undefined === table) {
    return columns;
  }
  const vid = viewIsInvalid ? "0000" : sidParse(bundle.inputData.table_view).view;
  /** @type DTableView */
  const view = _.find(table.views, ["_id", vid]);
  if (undefined === view || undefined === view.hidden_columns || !_.isArray(view.hidden_columns)) {
    return columns;
  }
  return _.filter(columns, (col) => !view.hidden_columns.includes(col.key));
};

/**
 * get table columns for update
 *
 * @param {Array<DTableColumn>} columns
 * @param {Bundle} bundle
 * @return {Array<DTableColumn>}
 */
const getUpdateColumns = (columns, bundle) => {
  return _.filter(getBundledViewColumns(columns, bundle), (col) => {
    return !struct.columns.zapier.hide_write.includes(col.type);
  });
};


module.exports = {
  acquireServerInfo,
  acquireDtableAppAccess,
  acquireLinkColumnsData,
  acquireMetadata,
  acquireTableMetadata,
  filter,
  tableNameId,
  getCollaborator,
  getCollaboratorData,
  getUpdateColumns,
  getBundledViewColumns,
  getImageData,
  getCollAndImage,
  mapColumnKeys,
  mapColumnKeysRow,
  mapCreateRowKeys,
  requestParamsSid,
  requestParamsBundle,
  downloadLink,
  downloadImageLink,
  linkRecord,
  // linkCreateRecord,
  linkRequest,
  sidParse,
  struct,
  tableFields,
  tableView,
  // standard
  outputFieldsRows,
  // noAuthLinks
  FEATURE_NO_AUTH_ASSET_LINKS: _CONST.FEATURE_NO_AUTH_ASSET_LINKS,
  // acquireFileNoAuthLinks,
  fileNoAuthLinksField,
  // mtimeFilter
  FEATURE_MTIME_FILTER: _CONST.FEATURE_MTIME_FILTER,
};
