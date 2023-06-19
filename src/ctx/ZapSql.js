
/**
 * SeaTable Column Type -> SQL Column Type
 * @link https://seatable.github.io/seatable-scripts/python/sql/#data-types
 * @type {{}}
 */
const sqlColumnTypeMap = {
  "text": "String",
  "long-text": "String",
  "number": "Float",
  "single-select": "String",
  "multiple-select": "List of strings",
  "checkbox": "Bool",
  "date": "Datetime",
  "image": "List of URL for images",
  "file": "List of file objects",
  "collaborator": "List of user IDs",
  "link": "List of linked rows",
  "formula": "The type depends on the return value of the formula",
  "creator": "User ID as string", // 5758ecdce3e741ad81293a304b6d3388@auth.local, default key: _creator
  "ctime": "Datetime", // default key: _ctime
  "last-modifier": "User ID as string", // 5758ecdce3e741ad81293a304b6d3388@auth.local, default key: _last_modifier
  "mtime": "Datetime", // default key: _mtime
  "auto-number": "String",
  "url": "String",
  "email": "String",
  "duration": "Float",
};

/**
 * SqlQuoteError
 *
 * quoting a name for an SQL query failed.
 */
class SqlQuoteError extends Error {
  /**
   * @param {string?} message
   */
  constructor(message) {
    super(message);
    this.name = "SqlQuoteError";
  }
}

/**
 * quote name/identifier for SeaTable SQL
 *
 * @param {string} name
 * @return {string}
 */
function sqlQuote(name) {
  name = name || "";
  if (name.includes("`")) {
    throw new SqlQuoteError(`Quote Error: backtick in identifier "${name}"`);
  }
  return `\`${name}\``;
}

/**
 * double-quote an SQL string
 *
 * @param {string} string
 * @return {string}
 */
function sqlString(string) {
  return "\"".concat(string.replace(/"/g, "\"\""), "\"");
}

/**
 * encode a value for SQL WHERE comparison (right side) based on the column
 * type.
 *
 * @param {string|number} value
 * @param {DTableColumnType} type
 * @return {string}
 */
function sqlEncodeValueByColumnType(value, type) {
  // by default, we quote it for safety, should SeaTable report an error then.
  const buffer = sqlString(String(value));

  /** @see ctx.struct.columns.zapier.row_lookup */
  switch (type) {
    case "text":
    case "date":
    case "url":
    case "email":
    case "auto-number":
      return buffer;
    case "number":
      return isNaN(value) ? buffer : Number(value);
    default:
      // for all types not eligible for row_lookup we log a message and use standard quoting as a fall-back
      console?.log(`sqlEncodeValueByColumnType(): Unknown or invalid column type '${type}' for encoding, using standard quoting`);
      return buffer;
  }
}

/**
 * SQL error
 */
class SqlError extends Error {
  /**
   * @param {string?} message
   */
  constructor(message) {
    super(message);
    this.name = "SqlError";
  }
}

/**
 * @class ZapSql
 */
class ZapSql {
  /** @private {ZapBundle} */
  #zb;

  /** @private {string} */
  #sql;

  /** @private {boolean} */
  #convertKeys;

  /** @private {Object} */
  #context;

  /**
   * @param {ZapBundle} zb
   * @param {string} sql
   * @param {boolean} convertKeys
   * @param {Object} context
   */
  constructor(zb, sql, convertKeys = false, context = {}) {
    this.#zb = zb;
    this.#sql = sql;
    this.#convertKeys = convertKeys;
    this.#context = context;
  }

  /**
   * @return {ZapBundle}
   */
  get zBundle() {
    return this.#zb;
  }

  /**
   * @param {boolean} throwSqlError? throws by default
   * @return {Promise<SqlResult>}
   */
  async run(throwSqlError = true) {
    const zb = this.#zb;
    const {z} = zb;
    const access = await zb.dtableCtx;

    const response = await z.request({
      method: "POST",
      url: `${access.server_address}/dtable-db/api/v1/query/${access.dtable_uuid}/`,
      headers: {Authorization: `Token ${access.access_token}`},
      body: {
        sql: this.#sql,
        convert_keys: this.#convertKeys,
      },
    });

    const result = new SqlResult(this.#sql, response.data, this.#convertKeys, this.#context);
    throwSqlError && result.throwIfNotSuccessful();

    return result;
  }
}

/**
 * @property {SqlQueryResult} result
 * @property {boolean} convert_keys
 * @property {Object} context
 */
class SqlResult {
  /**
   *
   * @param {string} sql
   * @param {SqlQueryResult} result
   * @param {boolean} convertKeys
   * @param {Object} context
   */
  constructor(sql, result, convertKeys = false, context = {}) {
    this.sql = sql;
    this.result = result;
    this.convert_keys = convertKeys;
    this.context = context;
  }

  /**
   * @return {string}
   */
  get error_message() {
    return this.result?.error_message || "";
  }

  /**
   * result row descriptor
   *
   * FIXME: TODO: **must** use proper typings. needs additional tests and
   *              support/binding in metadata.js
   *
   * @return {Array<Object|DTableMetadataTables>}
   */
  get metadata() {
    return this.result.metadata;
  }

  /**
   * @return {SqlQueryResultRows}
   */
  get results() {
    return this.result.results;
  }

  /**
   *
   * @return {boolean}
   */
  get success() {
    return !! this.result?.success;
  }

  /**
   * utility method to throw with default error message if the sql query
   * was not successful.
   */
  throwIfNotSuccessful() {
    if (this.success) {
      return;
    }
    throw new SqlError(`SQL Error: ${this.error_message} (SQL: ${this.sql})`);
  }
}

module.exports = {
  ZapSql,
  SqlQuoteError,
  SqlResult,
  sqlColumnTypeMap,
  sqlEncodeValueByColumnType,
  sqlQuote,
  sqlString,
};
