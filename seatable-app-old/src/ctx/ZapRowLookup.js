const {sqlQuote, sqlEncodeValueByColumnType} = require("./ZapSql");
const {MetadataTable} = require("../lib/metadata");

/**
 * @class ZapSql
 */
class ZapRowLookup {
  /** @private {ZapBundle} */
  #zb;

  /** @private {MetadataTable} */
  #table;

  /** @private {MetadataTableColumn} */
  #column;

  /** @private {string|number} */
  #value;

  /**
   * @param {ZapBundle} zb
   * @param {string} sql
   * @param {boolean} convertKeys
   * @param {Object} context
   */
  constructor(zb) {
    this.#zb = zb;
  }

  /**
   * @param {string|SidObj|MetadataTable} table
   * @param {string|SidObj|MetadataTableColumn} column  column:<key>
   * @param {string|number} value
   * @return {Promise<RowLookupResult>}
   */
  async byColumn(table, column, value) {
    if (!(table instanceof MetadataTable)) {
      table = (await this.#zb.metadata).tables.select(String(table));
    }
    this.#table = table;
    column = table.columns.select(column);
    this.#column = column;
    this.#value = value;

    const tableAndWhere = `${sqlQuote(table.name)} WHERE ${sqlQuote(column.name)} =
                                                         ${sqlEncodeValueByColumnType(value, column.type)}`;

    const sqlCount = await this.#zb.sqlQuery(`SELECT COUNT(*) FROM ${tableAndWhere}`, false, null, false);
    if (!sqlCount.success) {
      this.#zb.z.console.log(`SqlError[RL-50]: ${sqlCount.error_message} (SQL: ${sqlCount.sql})`);
    }

    const count = sqlCount.success ? sqlCount.results[0]["COUNT(*)"] : undefined;

    const sqlResult = sqlCount.success ?
        await this.#zb.sqlQuery(`SELECT _id, * FROM ${tableAndWhere} LIMIT 1;`) :
        undefined;

    return new RowLookupResult(this.#zb, this, count, sqlCount, sqlResult);
  }
}

/**
 * @property {number|undefined} count
 * @property {SqlResult} countResult
 * @property {SqlResult|undefined} rowIdResult
 */
class RowLookupResult {
  /** @private {ZapBundle} */
  #zb;

  /**
   * @property ZapRowLookup
   */
  #rowLookup;

  /**
   * @param {ZapBundle} zb
   * @param {ZapRowLookup} rowLookup
   * @param {number|undefined} count number of rows in lookup, undefined on SQL error
   * @param {SqlResult} countResult sql-result of COUNT(*) number of rows lookup, never undefined and contains the SQL error
   * @param {SqlResult} rowIdResult? sql-result (might be LIMITed) undefined on SQL error
   */
  constructor(zb, rowLookup, count, countResult, rowIdResult) {
    this.#zb = zb;
    this.#rowLookup = rowLookup;
    this.count = count;
    this.countResult = countResult;
    this.rowIdResult = rowIdResult;
  }

  /**
   * @return {string|null}
   */
  get errorMessage() {
    if (this.countResult.success) {
      return null;
    }
    return this.countResult.error_message;
  }

  /**
   * @return {?string} first result._id
   */
  firstId() {
    let updateRowId = null;
    const result = this.firstResult();
    // result was first result
    result && ({_id: updateRowId} = result);
    return updateRowId;
  }

  /**
   * @return {*|undefined} first sql result row
   */
  firstResult() {
    const {result: {results}} = this.rowIdResult;
    // getting the first result only (Limit 1)
    return results.length ? results[0] : undefined;
  }
}

module.exports = {
  ZapRowLookup,
  RowLookupResult,
};
