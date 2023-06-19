const ctx = require("../ctx");

const {ZapBundleFileHandler} = require("./ZapBundleFileHandler");
const {ZapBundleFileUploader} = require("./ZapBundleFileUploader");
const {ZapSql} = require("./ZapSql");
const {Metadata} = require("../lib/metadata");
const {ZapRowLookup} = require("./ZapRowLookup");

/**
 * ZapBundle.request() result
 *
 * @property {*|undefined} data (added in v10.0.0): The response content as an object if the content is JSON or application/x-www-form-urlencoded (undefined otherwise).
 */
class ZapResponse {
  /** @property {ZapBundle} */
  #zb;

  /** @property {*} */
  #response;

  /**
   * @param {ZapBundle} zb
   * @param {HttpResponse|RawHttpResponse} response
   */
  constructor(zb, response) {
    this.#zb = zb;
    this.#response = response;
    Object.assign(this, response);
  }
}

/**
 * z and bundle context
 */
class ZapBundle {
  /**
   * @property {ZObject}
   */
  z;

  /**
   * @property {B}
   */
  bundle;

  /**
   * @property {ctx}
   */
  ctx;

  /**
   * @param {ZObject} z
   * @param {Bundle} bundle
   */
  constructor(z, bundle) {
    this.z = z;
    this.bundle = bundle;
    this.ctx = ctx;
  }

  /**
   * @return {string|*}
   */
  toString() {
    return this.bundle.__zTS;
  }

  /**
   * @return {Promise<DTable>}
   */
  get dtable() {
    return this.dtableCtx.then((resolve) => this.bundle.dtable);
  }

  /**
   * z.request prepared for the base-app
   *
   * - request is authorized
   * - url dtable.server_address is prefixed if the url does not start with it
   * - url-curly-s:
   *    - {{dtable_uuid}}
   *
   * @param {string|{url: string?, headers: {Authorization: string?}?, skipHandleHTTPError: boolean?, skipThrowForStatus: boolean?}|HttpRequestOptions} options
   * @return {Promise<HttpResponse|RawHttpResponse|ZapResponse>}
   */
  async request(options) {
    const dtable = await this.dtable;

    if (typeof options === "string") {
      options = {url: options};
    }

    const serverAddress = options?.url?.startsWith(dtable.server_address) ?
        "" : dtable.server_address;

    const requestOptions = Object.assign(
        {url: null, method: "GET", headers: {}},
        options,
        {
          url: serverAddress.concat(
              options?.url?.replace("{{dtable_uuid}}", dtable.dtable_uuid),
          ),
          headers: Object.assign(
              {Authorization: `Token ${dtable.access_token}`},
              options.headers || {},
          ),
        },
    );

    return new ZapResponse(this, await this.z.request(requestOptions));
  }

  /**
   * @return {Promise<DTable>}
   */
  get dtableCtx() {
    return this.ctx.acquireDtableAppAccess(this.z, this.bundle);
  }

  /**
   *
   * @return {Promise<Metadata>}
   */
  get metadata() {
    if (this.bundle?.dtable?.metadata instanceof Metadata) {
      return Promise.resolve(this.bundle.dtable.metadata);
    }
    return this.ctx.acquireMetadata(this.z, this.bundle).then((resolve) => {
      return this.bundle.dtable.metadata = new Metadata(this.bundle.dtable.metadata);
    });
  }

  /**
   * @return {ZapRowLookup}
   */
  get rowLookup() {
    return new ZapRowLookup(this);
  }

  /**
   *
   * @param {string} sql
   * @param {boolean} convertKeys?
   * @param {Object} context?
   * @param {boolean} throwSqlError?
   * @return {Promise<SqlResult>}
   */
  sqlQuery(sql, convertKeys = false, context = {}, throwSqlError = true) {
    return (new ZapSql(this, sql, convertKeys, context)).run(throwSqlError);
  }

  /**
   * @return {ZapBundleFileUploader}
   */
  fileUploader() {
    return /** @type ZapBundleFileUploader*/ new ZapBundleFileUploader(this);
  }


  /**
   * @return {ZapBundleFileHandler}
   */
  fileHandler() {
    return new ZapBundleFileHandler(this);
  }

  /**
   * log-tag for use within performs
   *
   * initializes the console timer for it already.
   *
   * @param {string} tag
   * @return {Promise<{string}>}
   */
  async consoleLogTag(tag) {
    // zb.toString() requires the bundle .__zTs first.
    await this.ctx.acquireServerInfo(this.z, this.bundle);

    const logTag = `[${this}] ${tag}`;
    this.z.console.time(logTag);

    return logTag;
  }
}

module.exports = {
  ZapBundle,
};
