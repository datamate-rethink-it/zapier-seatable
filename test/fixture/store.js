'use strict';

const fs = require('fs');
const {parse} = require('node-html-parser');

const htmlFile = __dirname.concat('/select-column-list.html');
const jsonStorePath = __dirname.concat('/store');
const jsonStoreColumnsFile = jsonStorePath.concat('/columns.json');

/**
 *
 */
class FixtureStore {
  static staticColumnCount = 24;
  static staticColumnNamesHtmlFile = htmlFile;
  static staticColumnStoreJsonFile = jsonStoreColumnsFile;
  static staticColumnsOnlyTableName = 'Columns-Only-3.5.10';

  #columnNamesCache;

  /**
   * @return {number}
   */
  get columnCount() {
    return FixtureStore.staticColumnCount;
  }

  /**
   * @return {string}
   */
  get columnNamesHtmlFile() {
    return htmlFile;
  }


  /**
     * @return {Array<string>}
     */
  get columnNames() {
    return this.#columnNamesCache || (this.#columnNamesCache = parse(fs.readFileSync(htmlFile, 'utf8')).querySelectorAll('.select-column-item').map((value) => value.attributes?.title));
  }
}

module.exports = {
  FixtureStore,
};
