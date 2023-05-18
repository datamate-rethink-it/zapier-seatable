/*
 * seatable api context for zapier
 *
 * Written by Tom Klingenberg
 * Copyright 2021 SeaTable GmbH, Mainz
 */

const _CONST = require("./const");

const _ = require("lodash");
const { ResponseThrottleInfo } = require("./lib");
const { sidParse } = require("./lib/sid");

/**
 * context bound dtable struct
 *
 * @type {{columns: {filter: {not: [string, string, string, string]}, types: {date: string, image: string, creator: string, link: string, 'auto-number': string, mtime: string, url: string, collaborator: string, duration: string, number: string, 'multiple-select': string, file: string, 'single-select': string, checkbox: string, formula: string, ctime: string, text: string, 'long-text': string, email: string, geolocation: string, 'last-modifier': string}, zapier: {hide_write: string[]}}}}
 */
const struct = {
  columns: {
    types: {
      text: "Text",
      "long-text": "Long text",
      number: "Number",
      checkbox: "Checkbox",
      date: "Date",
      "single-select": "Single select",
      image: "Image",
      file: "File",
      "multiple-select": "Multiple select",
      collaborator: "Collaborator",
      url: "URL",
      email: "Email",
      duration: "Duration",
      geolocation: "Geolocation",
      rate: "Rating",
      formula: "Formula",
      "link-formula": "Link formula",
      link: "Link to other records",
      "auto-number": "Auto number",
      creator: "Creator",
      ctime: "Created time",
      "last-modifier": "Last modifier",
      mtime: "Last modified time",
      button: "Button",
    },
    assets: ["file", "image"],
    filter: {
      // column types that can not be filtered:
      not: ["file", "long-text", "image", "url"],
    },
    zapier: {
      // column types that zapier must not write/create (hidden):
      hide_write: [
        "file",
        "image",
        "link",
        "auto-number",
        "ctime",
        "mtime",
        "formula",
        "link-formula",
        "creator",
        "last-modifier",
        "button",
      ],
      // column types that zapier should not offer to search in (hidden):
      hide_search: ["link"],
      /**
       * column types that zapier offers for a row-lookup
       * @type {DTableColumnType[]}
       */
      row_lookup: ["text", "number", "date", "url", "email", "auto-number"],
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
  z.console.time(bundle.__zLogTag);

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
  properties.forEach(function (property) {
    const value = response.data[property];
    if (typeof value === "string") {
      serverInfo[property] = value;
    }
  });
  if (!~properties.indexOf("version") || !~properties.indexOf("edition")) {
    throw new Error(
      _CONST.STRINGS["seatable.error.no-server-info"](bundle.authData.server)
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
  return isEmpty(bundle.serverInfo)
    ? serverInfo(z, bundle)
    : Promise.resolve(bundle.serverInfo);
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
    headers: { Authorization: `Token ${bundle.authData.api_token}` },
    endPointPath: `/api/v2.1/dtable/app-access-token/`,
  });

  const dtable = { server_address: bundle.authData.server };
  const properties = (response.data && Object.keys(response.data)) || [];
  for (const property of properties) {
    dtable[property] = response.data[property];
  }
  const serverInfo = bundle.serverInfo;
  z.console.timeLog(
    bundle.__zLogTag,
    `app(${dtable.workspace_id}/${dtable.dtable_uuid}) ${serverInfo.version} ${serverInfo.edition} (${bundle.authData.server})`
  );
  if (
    !~properties.indexOf("dtable_uuid") ||
    !~properties.indexOf("access_token")
  ) {
    throw new Error(
      _CONST.STRINGS["seatable.error.app-access-token"](bundle.authData.server)
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
  return isEmpty(bundle.dtable)
    ? appAccessToken(z, bundle)
    : Promise.resolve(bundle.dtable);
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
const fileColumns = (columns) =>
  columns.filter((s) => struct.columns.assets.indexOf(s.type) + 1);
const noAuthColumnKey = (key) => `column:${key}-(no-auth-dl)`;
const noAuthColumnLabel = (name) => `${name} (Download w/o Authorization)`;
const noAuthFilePathFromUrl = (buffer) => {
  // 'https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg'
  const probe = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(buffer);
  return probe && probe[1];
};

const fileNoAuthLinksField = {
  key: _CONST.FEATURE_NO_AUTH_ASSET_LINKS,
  required: false,
  default: "False",
  type: "boolean",
  label: "Provide access to images and files",
  helpText:
    "By default (**False**) SeaTable provides links to files and images that require authentication. Choose **True** if you want to use your files and pictures in your Zapier Action, this adds additional fields with links that temporarily allow unauthorized downloads for a couple of hours.",
  altersDynamicFields: false,
};

/**
 * @generator
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @param {Bundle} bundle
 * @yield {*<{label: string, key: string}>}
 */
const outputFieldsFileNoAuthLinks = function* (columns, bundle) {
  if (!bundle.inputData[_CONST.FEATURE_NO_AUTH_ASSET_LINKS]) {
    return;
  }

  for (const col of fileColumns(columns)) {
    yield { key: noAuthColumnKey(col.key), label: noAuthColumnLabel(col.name) };
  }
};

/**
 * add non-authorized asset links into the result
 *
 * images and files, original data type (string or object) is kept, ads a new, suffixed entry.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {Array<DTableColumn|DTableColumnTLink>} columns
 * @param {Array<{object}>} rows
 */
const acquireFileNoAuthLinks = async (z, bundle, columns, rows) => {
  if (!bundle.inputData[_CONST.FEATURE_NO_AUTH_ASSET_LINKS]) {
    return rows;
  }

  const logTag = `[${bundle.__zTS}] acquireFileNoAuthLinks`;
  z.console.time(logTag);

  const dtableCtx = bundle.dtable;
  const fileUrlStats = { urls: [], errors: [] };
  const fileUrl = async (buffer) => {
    fileUrlStats.urls.push(buffer);
    const urlPath = noAuthFilePathFromUrl(buffer);
    if (!urlPath) {
      throw new z.errors.Error(`Failed to extract path from url: "${buffer}"`);
    }
    /** @type {ZapierZRequestResponse} */
    let response;
    let exception;
    const url = `${bundle.authData.server}/api/v2.1/dtable/app-download-link/?path=${urlPath}`;
    try {
      response = await z.request({
        url,
        headers: { Authorization: `Token ${dtableCtx.access_token}` },
        skipThrowForStatus: true,
      });
    } catch (e) {
      exception = e;
    }
    if (!_.isObject(response && response.data)) {
      if (_.isObject(exception) && exception.name === "ThrottledError") {
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
              typeof value === "object" &&
              value !== null &&
              value.type === "file" &&
              value.url
            ) {
              const copy = { ...value };
              copy.url = await fileUrl(value.url);
              return copy;
            } else if (typeof value === "string" && value) {
              return await fileUrl(value);
            }
            return value;
          })
        );
      }
      return row;
    })
  );
  z.console.timeLog(
    logTag,
    `urls: ${fileUrlStats.urls.length} (errors: ${fileUrlStats.errors.length})`
  );
  if (fileUrlStats.errors.length > 0) {
    z.console.timeLog(logTag, "errors:", fileUrlStats.errors);
  }
  return rows;
};

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
        childIds.length
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
          headers: { Authorization: `Token ${dtableCtx.access_token}` },
          params: { table_id: linkTableMetadata._id },
        });
        if (!_.isObject(response.data)) {
          throw new z.errors.Error(
            `Failed to retrieve table:${linkTableMetadata._id}:row:${childId}`
          );
        }
        const childRow = mapColumnKeys(
          _.filter(linkTableMetadata.columns, (c) => c.type !== "link"),
          response.data
        );
        z.console.timeLog(
          logTag,
          `child row(${new ResponseThrottleInfo(response)}): ${
            linkTableMetadata._id
          }:row:${childId} (request=${totalRequestCount})`
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
      `requests=${totalRequestCount} rows=${rows.length}`
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
      Authorization: `Token ${dtableCtx.access_token}`,
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
    bundle.inputData.table_name
  );
  if (!tableMetadata) {
    z.console.log(
      `[${bundle.__zTS}] internal: acquireTableMetadata: missing table metadata columns on input-data:`,
      bundle.inputData
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
      tableMetadata.columns
    );
    return f;
  }
  if (struct.columns.filter.not.includes(col.type)) {
    z.console.log(
      `[${bundle.__zTS}] filter[${context}]: known unsupported column type (user will see an error with clear description):`,
      col.type
    );
    throw new z.errors.Error(
      `Search in ${
        struct.columns.types[col.type] || `[${col.type}]`
      } field named "${
        col.name
      }" is not supported, please choose a different column.`
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
        col.type
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
 * @param {Array<DTableColumn>} columns
 * @param {object} row
 * @return {object} distinguished column-key mapped row
 */
const mapColumnKeys = async (z, bundle, columns, row) => {
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
        const regex = /^\w{32}@auth\.local$/;
        const v = row[c.name];
        if (regex.test(v[0])) {
          r[`column:${c.key}`] =await getCollaboratorData(z,bundle,v);
          continue;
        }else if(regex.test(v)){
          r[`column:${c.key}`] =await getCollaboratorData(z,bundle,[v]);
          continue;
        }
        r[`column:${c.key}`] = row[c.name];
      }
    }
    return r;
};

/**
 * map keys of a create row operation for output
 *
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
    bundleTableMeta(bundle)._id === col.data.other_table_id
      ? col.data.table_id
      : col.data.other_table_id;
  return _.find(bundle.dtable.metadata.tables, ["_id", linkTableId]);
};

/**
 * standard output fields based on the bundled table meta-data
 *
 * (since 2.0.0) all the rows columns with the resolution of linked rows columns (supports column.type link)
 *
 * @generator
 * @param {Array<DTableColumn|DTableColumnTLink>} columns (e.g. tableMetadata.columns)
 * @param {Bundle} bundle
 * @yields {{label: string, key: string}[]}
 */
const outputFieldsRows = function* (columns, bundle) {
  for (const col of columns) {
    const f = { key: `column:${col.key}`, label: col.name };

    // link field handling
    const linkTableMetadata = columnLinkTableMetadata(col, bundle);
    if (undefined !== linkTableMetadata) {
      const children = [
        { key: `${f.key}[]row_id`, label: `${col.name}: ID` },
        {
          key: `${f.key}[]row_mtime`,
          label: `${col.name}: Last Modified`,
        },
      ];
      for (const c of linkTableMetadata.columns) {
        if (c.type === "link") continue;
        children.push({
          key: `${f.key}[]column:${c.key}`,
          label: `${col.name}: ${c.name}`,
        });
      }
      f.children = children;
    }

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
  for ({ _id, name } of tableMetadata.views) {
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
  let table_id = bundle.inputData.table_name;
  let new_table_id = table_id.split(":");
  let TABLE_ID = new_table_id[1];
  let colName = "";
  let tableName = "";
  let colType = "";
  const MetaData = await acquireMetadata(z, bundle);
  const tableMetadata = await acquireTableMetadata(z, bundle);
  const sid = sidParse(bundle.inputData.search_column);
  const col = _.find(tableMetadata.columns, ["key", sid.column]);
  if (undefined === col) {
    z.console.log(
      `[${bundle.__zTS}] filter[${context}]: search column not found:`,
      bundle.inputData.search_column,
      sid,
      tableMetadata.columns
    );
    return f;
  }
  if (struct.columns.filter.not.includes(col.type)) {
    z.console.log(
      `[${bundle.__zTS}] filter[${context}]: known unsupported column type (user will see an error with clear description):`,
      col.type
    );
    throw new z.errors.Error(
      `Search in ${
        struct.columns.types[col.type] || `[${col.type}]`
      } field named "${
        col.name
      }" is not supported, please choose a different column.`
    );
  }
  colType = col.type;
  colName = col.name;
  let tb = _.map(
    _.filter(MetaData.tables, (table) => {
      // console.log(table);
      return table._id === TABLE_ID;
    }),
    (tableObject) => {
      return tableObject.name;
    }
  );
  tableName = tb[0];
  // const query = colType==="Text"?`${colName} = "${bundle.inputData.search_value}"`:`${colName} = ${bundle.inputData.search_value}`;
  let f = {
    sql: `SELECT * FROM ${tableName} WHERE ${colName} = "${bundle.inputData.search_value}" LIMIT 10`,
    convert_keys: true,
  };
  return f;
};
const getCollaborator = async (z, bundle, value) => {
  let collaboratorEmail = value;
  const collaborator = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/related-users/`,
    method: "GET",
    headers: { Authorization: `Token ${bundle.dtable.access_token}` },
  });
  const collaboratorData = collaborator.json.user_list;
  const collData = _.map(
    _.filter(collaboratorData, (o) => {
      return o.contact_email === collaboratorEmail;
    }),
    (o) => {
      return o.email;
    }
  );
  return collData;
};
const getCollaboratorData = async (z, bundle, value) => {
  let collaboratorUsers = value;
  const collaborator = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/related-users/`,
    method: "GET",
    headers: { Authorization: `Token ${bundle.dtable.access_token}` },
  });
  const collaboratorData = collaborator.json.user_list;
  const collData = _.map(
    _.filter(collaboratorData, (o) => {
      const regex = /^\w{32}@auth\.local$/;
        for(let i=0;i<collaboratorUsers.length;i++){
            if(o.email === collaboratorUsers[i] && regex.test(collaboratorUsers[i])){
                return o.email === collaboratorUsers[i];
            }
        }
    }),
    (o) => {
      return { username: o.email, email: o.contact_email, name: o.name };
    }
  );
  return collData;
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
  FEATURE_NO_AUTH_ASSET_LINKS: _CONST.FEATURE_NO_AUTH_ASSET_LINKS,
  acquireFileNoAuthLinks,
  outputFieldsFileNoAuthLinks,
  fileNoAuthLinksField,
  // mtimeFilter
  FEATURE_MTIME_FILTER: _CONST.FEATURE_MTIME_FILTER,
};
