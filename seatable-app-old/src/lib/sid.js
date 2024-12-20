
/**
 * @file Utility for SID
 */

/**
 * Constants of SID
 *
 * @type {{NAMES: {TABLE: string, COLUMN: string, ROW: string, VIEW: string}, DELIM: string}}
 */
const SID_CONST = {
  /**
   * @typedef {('table'|'view'|'row'|'column')} SidName
   */
  NAMES: {
    TABLE: "table", // table-id, "_id", 0000 is default
    VIEW: "view", // view-id, "_id", 0000 is default
    ROW: "row", // row-id, "_id", no default
    COLUMN: "column", // column-key, "key", 0000 is default
  },
  DELIM: ":",
};

/**
 * @template {object} T
 * @param {T} object
 * @return {T} deep frozen object
 */
function deepFreeze(object) {
  // Retrieve the property names defined on the object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

deepFreeze(SID_CONST);

/**
 * TODO: old-new Sid use, {@see SidObj()} and {@see sidParse()} which
 *       in future exports from here.
 */

/**
 * @typedef {object} SidRootObj
 */

/**
 * @typedef {SidRootObj} SidTableObj
 * @property {string} table
 * @property {string} [view]
 * @property {string} [row]
 */

/**
 * @typedef {SidRootObj} SidColumnObj
 * @property {string} column
 */

/**
 * sid object w/ identity (SidObj)
 *
 * @extends SidTableObj
 * @extends SidColumnObj
 * @extends {}
 */
class SidObj {
  /**
   * @param {object} object
   */
  constructor(object) {
    const noUndefinedProps = Object.fromEntries(
        Object.entries(object).filter(([, value]) => value !== undefined),
    );
    Object.assign(
        this,
        noUndefinedProps,
    );
  }

  /**
   * @return {string} sid
   */
  toString() {
    let buffer = "";
    for (const [key, value] of Object.entries(this)) {
      buffer = buffer.concat(buffer ? ":" : "", key, ":", value);
    }
    return buffer;
  }
}

/**
 * parse seatable api sub-identifier (sid)
 *
 * parse only right now, encoding is simple string building. format definition is here.
 *
 * table:{id}     the format is not very well-defined, we can see 4 characters of a-z, A-Z and 0-9.
 *                -> request of specification from Seatable, talked with MW, no feedback yet
 * column:{key}   the format is not very well-defined, similar to table:{id} we can see 4 characters
 *                of a-z, A-Z and 0-9.
 * table:{id}:view:{id}
 *                the view is in context of a table as per base, views and tables can have the same
 *                ids. therefore it is not possible to identify the table via the view-id alone when
 *                there could be a table meant as well (only with an additional rule/data like prefer
 *                the more specific (view) over the less (table) which is not possible with a resource
 *                name alone, hence the hierarchy).
 * table:{id}:row:{id}
 *                table row
 *
 * NOTE: current implementation is lax on the length of id/keys, 4 is the minimum length, "_" and "-"
 *       are allowed to be by part anywhere while they were not seen in id/key (only in identifiers/keys
 *       of other entities)
 *
 * EXAMPLE:
 *
 *    sid: 'table:0000:view:0000' -> {table: '0000', view: '0000}
 *
 * NOTE: returns an empty object ({}) given the sid parameter is not a string. This is to allow hasOwnProperty
 *       checks on the result which only work with objects.
 *
 * @param {string|SidObj} sid
 * @param {any} fallback [optional] zero or one, zero throws, one is default otherwise
 * @return {SidObj} sid-object (which can be empty, e.g. not table, column etc. properties
 * @throws Error if sid is of invalid syntax
 */
function sidParse(sid, ...fallback) {
  let result = false;
  if (sid instanceof SidObj) {
    sid = String(sid);
  }
  const isString = (typeof sid === "string" || sid instanceof String);
  if (!isString) {
    return fallback.length ? fallback[0] : {};
  }

  const idAny = "[a-zA-Z0-9_-]{4,}";
  const id = (name) => `${name}:(?<${name}>${idAny})`;
  for (const token of [
    `${id("table")}`,
    `${id("column")}`,
    `${id("table")}:${id("view")}`,
    `${id("table")}:${id("row")}`,
    `${id("table")}:${id("column")}`,
  ]) {
    result = result || sid.match(new RegExp( `^${token}$` ));
  }

  if (!result && fallback.length) {
    return fallback[0];
  }
  if (!result) {
    // throw new Error(`unable to parse (invalid) sid: "${sid}"`);
    return false;
  }

  return new SidObj(result.groups);
}

module.exports = {
  sidParse,
  SidObj,
};
