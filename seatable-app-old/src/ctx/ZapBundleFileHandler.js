const ctx = require("../ctx");
const {sqlQuote} = require("../ctx/ZapSql");

/**
 * @class AssetUrlInfo
 */
class AssetUrlInfo {
  /**
   * {DTable}
   */
  #dtable;

  /**
   *
   * @param {DTable} dtable
   */
  constructor(dtable) {
    this.#dtable = dtable;
  }

  /**
   * url is of a base asset
   *
   * an url is of a base asset if it starts like
   *
   * asset url example:
   *
   * - https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg
   *    (302 redirect to https://cloud.seatable.io/seafhttp/files/05abf737-4875-49a1-8271-1566bb530952/magazine2.jpg if
   *     authenticated in FE)
   *
   * non-asset url example:
   *
   * all in all every other URL that is not within the pattern of an assert url (above example), just on the internets:
   *
   * - https://example.com/image.jpg
   * - https://creativecommons.org/wp-content/uploads/2022/07/CCLogoColorPop1.gif
   *
   * however there can be situations that lead to
   *
   * - http://cloud.example.io/workspace/0815/asset/a9d02ac9-1dfb-4692-8867-78776e0ff081/images/encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0b-uC8fZHIp9YDY1HqgzLR1cXlkIy7u0XtA&usqp=CAU
   *
   * @param {string} url
   * @return {boolean}
   */
  urlIsAsset(url) {
    const {server_address: server, workspace_id: id, dtable_uuid: uuid} = this.#dtable;
    const prefix = `${server}/workspace/${id}/asset/${uuid}/`;
    return url.startsWith(prefix);
  };

  /**
   * path of asset (in base)
   *
   * relative path, relative to the base. in a dtable-file, this is in "asset/<path>" subtree.
   *
   * path examples:
   *
   * * files/2021-04/magazine2.jpg
   * * images/2022-08/IMG_1791 (1).jpeg
   * * page-design/jZUJ/jZUJ.json
   * * page-design/jZUJ/jZUJ.png
   *
   * @param {string} url
   * @return {null|string} files/2021-04/magazine2.jpg or null if not an asset-url
   */
  urlGetAssetPath(url) {
    const {server_address: server, workspace_id: id, dtable_uuid: uuid} = this.#dtable;
    const prefix = `${server}/workspace/${id}/asset/${uuid}/`;
    if (!url.startsWith(prefix)) {
      return null;
    }
    return url.substring(prefix.length);
  }

  /**
   * get basename(url)
   *
   * @param {string} url
   * @return {string}
   */
  urlGetBasename(url) {
    return decodeURIComponent((new URL(url)).pathname.split("/").pop());
  }
}

/**
 * SeaTable File Handler (ZapBundle)
 */
class ZapBundleFileHandler {
  /** @type {ZapBundle}*/
  #zb;

  /**
   * @param {ZapBundle} zb
   */
  constructor(zb) {
    this.#zb = zb;
  }

  /**
   * all asset columns of the base
   *
   * as a list of named column, table expressions
   *
   * @return {Promise<Array<{column: MetadataTableColumn, table: MetadataTable, sid: string}>>}
   */
  async listAssetColumns() {
    return (await this.#zb.metadata).findColumnsByType(...ctx.struct.columns.assets);
  }

  /**
   * find asset column metadata colum/table/sid triple by sid (table,column)
   *
   * @param {string|SidObj} sid
   * @return {Promise<{column: MetadataTableColumn, table: MetadataTable, sid: string}>}
   */
  async findAssetColumn(sid) {
    const assetColumns = await this.listAssetColumns();
    for (const assetColumn of assetColumns) {
      if (assetColumn.sid === String(sid)) {
        return assetColumn;
      }
    }
  }

  /**
   * all assets of a base (via rows)
   *
   * those that are in use within the base.
   *
   * implementation steps:
   *
   *   index all assets (key: url)
   *     [1/7] create assetsIndex (Map)
   *     [2/7] check asset-url
   *     [3/7] extract asset-path (in base-assets)
   *     [4/7] column type use
   *     [5/7] last access-time
   *     [6/7] best data: string (commonly for image), object otherwise (commonly for file)
   *     [7/7] places of use (incl. index and total count in the column data)
   *
   * @return {Promise<*[]>}
   */
  async queryRowAssets() {
    const zb = this.#zb;

    /** @var {Promise<Array<Promise<SqlResult>>>} queries */
    const queries = this.listAssetColumns().then((list) => list.map((tableColumn) => {
      const column = sqlQuote(tableColumn.column.name);
      const table = sqlQuote(tableColumn.table.name);
      const sql = `SELECT _id, _mtime, _ctime, ${column}
                   FROM ${table}
                   WHERE ${column} IS NOT NULL LIMIT 10000`;
      return zb.sqlQuery(sql, true, tableColumn);
    }));

    const sqlResults = await Promise.all(await queries);

    const assetsIndex = new Map();

    const fileHandler = this;

    /**
     * @param {DTableAssetImage|DTableAssetFile} datum
     * @param {number} index
     * @param {Array<DTableAssetImage|DTableAssetFile>} data
     * @param {SqlQueryResultRow} row
     * @param {DTableTableColumn} tableColumn
     */
    const register = async function(datum, index, data, row, {table, column}) {
      if (!~ctx.struct.columns.assets.indexOf(column.type)) {
        throw new Error(`Unsupported column type: ${column.type}`);
      }

      const assetUrl = datum.url || datum;
      const asset = assetsIndex.get(assetUrl) || assetsIndex.set(assetUrl, {
        url: assetUrl,
        isAsset: await fileHandler.urlIsAsset(assetUrl),
        path: await fileHandler.urlGetAssetPath(assetUrl),
        seenCount: 0,
        seenTypeCount: (new Map()).set("file", 0).set("image", 0),
        atime: null,
        bestData: null,
        uses: new Map(),
      }).get(assetUrl);

      asset.seenCount++;
      asset.seenTypeCount.set(column.type,
          1 + asset.seenTypeCount.get(column.type));

      const atime = row._mtime;
      if (!asset.atime) {
        asset.atime = atime;
      } else if (asset.atime < atime) {
        asset.atime = atime;
      }

      // take the best data (the highest resolution the base has for the asset)
      // null, string, anything else (object)
      if (!asset.bestData) {
        asset.bestData = datum;
      } else if (typeof datum !== "string") {
        asset.bestData = datum;
      }

      const useKey = `table:${table._id}:column:${column.key}:row:${row._id}`;
      asset.uses.set(useKey, [index, data.length]);
    };

    // register from results
    for (const sqlResult of sqlResults) {
      if (!sqlResult.success) {
        continue;
      }
      const {context} = sqlResult;
      const column = context.column;
      for (const [data, row] of sqlResult.results.
          map((row) => [row[column.name], row])) {
        let index = 0;
        for (const datum of data) {
          await register(datum, index, data, row, context);
          index++;
        }
      }
    }

    // splat map into array
    return [...assetsIndex.values()];
  }

  /**
   * url is of a base asset
   *
   * @see AssetUrlInfo.urlIsAsset()
   * @param {string} url
   * @return {Promise<boolean>}
   */
  async urlIsAsset(url) {
    return (new AssetUrlInfo(await this.#zb.bundle.dtable)).urlIsAsset(url);
  };

  /**
   * path of asset (in base)
   *
   * @see AssetUrlInfo.urlGetAssetPath()
   * @param {string} url
   * @return {null|string} files/2021-04/magazine2.jpg or null if not an asset-url
   */
  async urlGetAssetPath(url) {
    return (new AssetUrlInfo(await this.#zb.bundle.dtable)).urlGetAssetPath(url);
  }

  /**
   * @return {Promise<AssetUrlInfo>}
   */
  get urlInfo() {
    return this.#zb.dtableCtx.then((resolve) => new AssetUrlInfo(resolve));
  }
}

module.exports = {
  ZapBundleFileHandler,
};
