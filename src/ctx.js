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
// const {ResponseThrottleInfo} = require("./lib");
// const {format} = require("./lib");
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
      "file": "Add a file, a public reachable URL or any string (Zapier will turn text into a .txt file and upload it).",
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
    assets: ["file", "image", "digital-sign"],
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
 * !! ALWAYS USE acquireServerInfo instead of serverInfo to avoid multiple requests !!
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{}>}
 */
async function serverInfo(z, bundle) {
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
    throw new Error(`Failed to connect to SeaTable server at "${bundle.authData.server}". Please check the server address.`);
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
 * authenticates with app-access-token and adds "dtable" to bundle with elements app_name, access_token, dtable_uuid, dtable_server, dtable_socket, dtable_db, workspace_id and dtable_name
 * !! ALWAYS USE acquireDtableAppAccess instead of appAccessToken to avoid multiple requests !!
 *
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
  if (
    !~properties.indexOf("dtable_uuid") ||
    !~properties.indexOf("access_token")
  ) {
    throw new Error(`Failed to get app-access on SeaTable server at ${bundle.authData.server}. Try to re-authenticate with a new API-Token.`);
  }
  bundle.dtable = dtable;

  // ... remove trailing slash
  bundle.authData.server = bundle.authData.server.replace(/\/+$/, "");

  return bundle.dtable;
}


/**
 * bind dtable in bundle
 * authenticates with app-access-token and adds "dtable" to bundle with elements app_name, access_token, dtable_uuid, dtable_server, dtable_socket, dtable_db, workspace_id and dtable_name
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

/*
const featureLinkColumnsData = {
  enabled: true, // whether data of linked columns are fetched (2.1.0: true)
  childLimit: 1, // number of children (linked rows) per source row.column that are resolved (2.1.0: 1)
  resolveLimit: 10, // number of total resolves that are done
};
*/

const fileNoAuthLinksField = {
  key: _CONST.FEATURE_NO_AUTH_ASSET_LINKS,
  required: false,
  default: "False",
  type: "boolean",
  label: "Provide access to images, files and digital signatures",
  helpText:
    "**False:** You get only *internal links* to your files, images and signatures that require an authentication and therefore can not be used in your Zapier actions. Still you get access to the metadata of your files. **True:** You get access to your files, images and signatures. SeaTable also creates public download links (valid for a few hours). This requires additional API calls, so the [limits](https://api.seatable.io/reference/limits) may be exhausted earlier.",
  altersDynamicFields: false,
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
  // z.console.log("acquireMetadata", dtableCtx.metadata);
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
  if (typeof bundle.dtable !== "undefined") {
    if (typeof bundle.dtable.tableMetadata !== "undefined") {
      return bundle.dtable.tableMetadata;
    }
  }
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
        "internal: acquireTableMetadata: missing table metadata columns on input-data:",
        bundle.inputData,
    );
  }
  // z.console.log("acquireTableMetadata", tableMetadata);
  bundle.dtable.tableMetadata = tableMetadata;
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
/*
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
*/

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
 * generate temporary public link and hydrate file
 * requires internal link as input (possible for files, images and digital signatures)
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {string} url
 * @return {object}
 */
const getDownloadLinkFromPath = async (z, bundle, url) => {
  let urlPath = url;
  let seaTableAsset = false;

  /**
   * input is like:
   * a) file (intern): https://stage.seatable.io/workspace/24/asset/c392d08d-.../files/2023-06/tests.docx
   * b) image (intern): https://stage.seatable.io/workspace/24/asset/c392d08d-.../images/2023-06/problem.png
   * c) digi-sign (intern): /digital-signs/2023-06/a5adebe279e04415a28b2c7e256e9e8d%40auth.local-1686908335767.png
   * d) image (public available): https://seatable.io/wp-content/uploads/2021/09/seatable-logo.png
   *
   * a+b => extract path, get public link, hydrate
   * c   => get public link, hydrate
   * d   => hydrate
   */

  if (/\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.test(url)) {
    urlPath = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(url)?.[1];
    seaTableAsset = true;
  }
  if (/\/digital-signs\/[0-9a-f-]+(\/.*)/.test(url)) {
    urlPath = url;
    seaTableAsset = true;
  }

  // z.console.log("seaTableAsset", seaTableAsset);
  // z.console.log("urlPath", urlPath);

  // get public download link (temporary) - if needed
  if (seaTableAsset) {
    const downloadLink = await z.request({
      url: `${bundle.authData.server}/api/v2.1/dtable/app-download-link/?path=${urlPath}`,
      method: "GET",
      headers: {Authorization: `Token ${bundle.authData.api_token}`},
    });
    const data = downloadLink.json;
    // z.console.log("DEBUG: downloadLink.json", data);
    if (!data.download_link) {
      throw new z.errors.Error(`Failed to obtain asset download link for path '${urlPath}' of url '${url}'`);
    }
    publicUrl = data.download_link;
  } else {
    publicUrl = urlPath;
  }

  // return hydrated file and download link
  // const publicUrl = data.download_link;
  const hydratedUrl = z.dehydrateFile(stashFile, {
    downloadUrl: publicUrl,
  });
  return {publicUrl, hydratedUrl};
};


/**
 * Transforms the result of api call to get rows into the correct output format.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {Object} columns
 * @param {??} row
 * @returns
 */

const mapColumnKeysAndEnhanceOutput = async (z, bundle, columns, row) => {
  const r = {};
  const hop = (a, b) => Object.prototype.hasOwnProperty.call(a, b);

  // step 1: implicit row properties
  // (_id becomes row_id, _mtime becomes row_mtime)
  const implicit = ["_id", "_mtime", "_ctime"];
  for (const p of implicit) {
    if (hop(row, p)) {
      r[`row${p}`] = row[p];
    }
  }

  // step 2: walk all columns.
  // replace column names with column:{column_key}
  // enhance columns

  // collaborator regex
  const regex = /^\w{32}@auth\.local$/;

  for (const c of columns) {
    if (undefined !== c.key && undefined !== c.name && hop(row, c.name)) {
      const v = row[c.name];

      // prepopulation does not need to be enhanced...
      if (bundle.meta.isPopulatingDedupe) {
        continue;
      }

      // ignore _ctime and _mtime
      if ("_ctime" === c.key || "_mtime" === c.key) {
        continue;
      }

      // Collaborator
      if ("collaborator" === c.type && c.data && v) {
        if (regex.test(v[0])) {
          r[`column:${c.key}`] = await getCollaboratorData(z, bundle, v);
          continue;
        }
      }

      // Creator + Modifier
      if ("last-modifier" === c.type || "creator" === c.type) {
        if (regex.test(v)) {
          r[`column:${c.key}`] = await getCollaboratorData(z, bundle, [v]);
          continue;
        }
      }

      // Files (can contain multiple files)
      if ("file" === c.type) {
        // attach publicUrl and asset if requested.
        if (bundle.inputData.feature_non_authorized_asset_downloads) {
          for (const file of v) {
            const pubFile = await getDownloadLinkFromPath(z, bundle, file.url);
            // z.console.log("DEBUG pubFile", pubFile);
            file.publicUrl = pubFile.publicUrl;
            file.asset = pubFile.hydratedUrl;
          }
        } else {
          for (const file of v) {
            file.url = "No access";
          }
        }
        r[`column:${c.key}`] = v;
        continue;
      }

      // Image (can contain multiple images)
      if ("image" === c.type) {
        // enhance the image output in general
        const vv = getImageData(v);

        // attach publicUrl and asset if requested.
        if (bundle.inputData.feature_non_authorized_asset_downloads) {
          for (const file of vv) {
            const pubFile = await getDownloadLinkFromPath(z, bundle, file.url);
            file.publicUrl = pubFile.publicUrl;
            file.asset = pubFile.hydratedUrl;
          }
        } else {
          for (const file of vv) {
            file.url = "No access";
          }
        }
        r[`column:${c.key}`] = vv;
        continue;
      }

      // Digital-signature (can only be one)
      if ("digital-sign" === c.type) {
        if (regex.test(v["username"])) {
          const collaboratorInfo = await getCollaboratorData(z, bundle, [v["username"]]);
          r[`column:${c.key}`] = {...v, ...collaboratorInfo[0]};
          if (bundle.inputData.feature_non_authorized_asset_downloads) {
            const pubFile = await getDownloadLinkFromPath(z, bundle, v["sign_image_url"]);
            r[`column:${c.key}`].publicUrl = pubFile.publicUrl;
            r[`column:${c.key}`].asset = pubFile.hydratedUrl;
          } else {
            r[`column:${c.key}`].sign_image_url = "No access";
          }
          continue;
        }
      }

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
  const implicit = ["_id", "_mtime", "_ctime"];
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
/*
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
*/

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

    // if ( col.type === "creator" || col.type === "ctime" || col.type === "last_modifier" || col.type == "mtime" ){
    //   continue;
    // }

    if ( col.type === "collaborator") {
      const children = [
        {key: `${f.key}[]name`, label: `${col.name}: Name`},
        {key: `${f.key}[]username`, label: `${col.name}: Username`},
        {key: `${f.key}[]email`, label: `${col.name}: Email`},
      ];
      f.children = children;
      // here no continue;
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
        {key: `${f.key}[]url`, label: `${col.name}: File URL (requires Auth.)`},
        {key: `${f.key}[]publicUrl`, label: `${col.name}: File URL (temp. available)`},
        {key: `${f.key}[]asset`, label: `${col.name}: File Asset`},
      ];
      f.children = children;
    }

    if ( col.type === "digital-sign" ) {
      yield {key: `${f.key}__sign_time`, label: `${col.name}: Signature time`};
      yield {key: `${f.key}__sign_image_url`, label: `${col.name}: Signature URL (requires Auth.)`};
      yield {key: `${f.key}__publicUrl`, label: `${col.name}: Signature URL (temp. available.)`};
      yield {key: `${f.key}__username`, label: `${col.name}: Username`};
      yield {key: `${f.key}__email`, label: `${col.name}: Email`};
      yield {key: `${f.key}__name`, label: `${col.name}: Signed by`};
      yield {key: `${f.key}__asset`, label: `${col.name}: Signature Asset`};
      continue;
    }

    yield f;
  }
  /**
   * diese müssen weg:
   *   { key: 'column:_creator', label: 'Creator' },
   *   { key: 'column:_ctime', label: 'Created time' },
   *   { key: 'column:_last_modifier', label: 'Last modifier' },
   *   { key: 'column:_mtime', label: 'Modified' },
   **/
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
    helpText: "",
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
      helpText: "*Note:* This trigger checks only the first 1000 rows. If your table has more rows, please select a view and make sure that this view has either less than 1000 rows or that the newest entries are sorted to the top.",
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
        `filter[${context}]: search column not found:`,
        bundle.inputData.search_column,
        sid,
        tableMetadata.columns,
    );
    return f;
  }
  if (struct.columns.filter.not.includes(col.type)) {
    z.console.log(
        `filter[${context}]: known unsupported column type (user will see an error with clear description):`,
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
    // z.console.log("DEBUG search_wildcards on", bundle.inputData.search_wildcards);
    return {
      sql: `SELECT * FROM ${tableName} WHERE ${colName} LIKE "%${bundle.inputData.search_value}%" LIMIT 10`,
      convert_keys: true,
    };
  } else {
    // z.console.log("DEBUG search_wildcards off", bundle.inputData.search_wildcards);
    return {
      sql: `SELECT * FROM ${tableName} WHERE ${colName} = "${bundle.inputData.search_value}" LIMIT 10`,
      convert_keys: true,
    };
  }
};

/**
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Array}
 */
async function getCollaborators(z, bundle) {
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${bundle.dtable.dtable_uuid}/related-users/`,
    method: "GET",
    headers: {
      "Authorization": `Token ${bundle.dtable.access_token}`,
    },
  });
  return (bundle.dtable.collaborators = response.data.user_list);
}

/**
 * bind collaborators in bundle
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<DTable>}
 */
const acquireCollaborators = (z, bundle) => {
  return isEmpty(bundle.dtable.collaborators) ?
    getCollaborators(z, bundle) :
    Promise.resolve(bundle.dtable.collaborators);
};


// input ist cdb@seatable.io
// output ist xxx@auth.local
const getCollaborator = async (z, bundle, value) => {
  const collaborators = await acquireCollaborators(z, bundle);
  const collaboratorEmail = value;
  const collaboratorData = collaborators.user_list;
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


// input: array with usernames [xxx@auth.local, xyz@auth.local]
// output: array with enhanced objects [{username: ..., ...}, {username: ..., ...}]
const getCollaboratorData = async (z, bundle, value) => {
  // const collaborators = await acquireCollaborators(z, bundle);
  const collaboratorUsers = value;
  const collaboratorData = bundle.dtable.collaborators;
  const collData = _.map(
      _.filter(collaboratorData, (o) => {
        const regex = /^\w{32}@auth\.local$/;
        for (let i = 0; i < collaboratorUsers.length; i++) {
          if ( o.email === collaboratorUsers[i] && regex.test(collaboratorUsers[i]) ) {
            return o.email === collaboratorUsers[i];
          }
        }
      }),
      (o) => {
        return {username: o.email, email: o.contact_email, name: o.name};
      },
  );
  // z.console.log("collData", collData);
  return collData;
};

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

  // link_id is always correct. table_row_id is always the row id of the source, and other_table_row_id is always the target
  // but sometimes the table_row_id and other_table_row_id are mixed and have to be switched...
  // "table:" + bodyData.table_id === bundle.inputData?.["table_name"]. Wenn nicht, dann welchseln
  if ( `table:${bodyData.table_id}` != bundle.inputData?.["table_name"] ) {
    const tmpId = bodyData.table_id;
    bodyData.table_id = bodyData.other_table_id;
    bodyData.other_table_id = tmpId;
    // z.console.log("DEBUG linkRecord switch tables", tmpId);
  }

  // enhance with table names from table ids.
  _.map(TablesData, (o) => {
    if (bodyData.table_id === o._id) {
      bodyData.table_name = o.name;
    }
    if (bodyData.other_table_id === o._id) {
      bodyData.other_table_name = o.name;
    }
  });

  // z.console.log("DEBUG linkTwoRecord bodyData", bodyData);
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

/*
const getCollAndImage = async (z, bundle, value) => {
  const Data = value;
  const newArray = _.map(Data, async (o) => {
    o.Image = getImageData(o.Image);
    o.Collaborator = await getCollaboratorData(z, bundle, o.Collaborator);
    return o;
  });
  return newArray;
};
*/

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


// fallback image file name
const getImageFilenameFromUrl = (url, fallback = "Unnamed attachment") => {
  // z.console.log("getImageFilenameFromUrl", url);
  const lastPart = url.split("/")?.pop();
  if (!lastPart || "string" !== typeof lastPart) {
    return fallback;
  }
  const uploadFilename = decodeURIComponent(lastPart);
  if (!uploadFilename || "string" !== typeof uploadFilename) {
    return fallback;
  }
  return /^.+\.[a-zA-Z0-9]{3,4}$/.test(uploadFilename) ? uploadFilename : fallback;
};


module.exports = {
  acquireServerInfo,
  acquireDtableAppAccess,
  acquireCollaborators,
  acquireMetadata,
  acquireTableMetadata,
  // filter,
  tableNameId,
  getCollaborator,
  getCollaboratorData,
  getUpdateColumns,
  getBundledViewColumns,
  getImageData,
  // getCollAndImage,
  mapColumnKeysAndEnhanceOutput,
  mapColumnKeysRow,
  mapCreateRowKeys,
  requestParamsSid,
  requestParamsBundle,
  getDownloadLinkFromPath,
  // getDownloadImageLink,
  // downloadSignLink,
  linkRecord,
  linkRequest,
  sidParse,
  struct,
  tableFields,
  tableView,
  // standard
  outputFieldsRows,
  getImageFilenameFromUrl,
  // noAuthLinks
  FEATURE_NO_AUTH_ASSET_LINKS: _CONST.FEATURE_NO_AUTH_ASSET_LINKS,
  // acquireFileNoAuthLinks,
  fileNoAuthLinksField,
  // mtimeFilter
  FEATURE_MTIME_FILTER: _CONST.FEATURE_MTIME_FILTER,
};
