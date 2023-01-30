'use strict';

/**
 * string formatter as template tag
 *
 * @param {string[]} strings
 * @param {string|number} keys
 * @return {function(...[*]): string}
 */
function format(strings, ...keys) {
  return (...values) => {
    const dict = values[values.length - 1] || {};
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}

/**
 * @typedef {object} SidObjRoot
 */

/**
 * @typedef {object} SidObjTable
 * @property {string} table
 * @property {string} [view]
 * @property {string} [row]
 */

/**
 * @typedef {object} SidObjColumnOnly
 * @property {string} column
 */

/**
 * sid object w/ identity (SidObj)
 *
 * @extends SidObjTable
 * @extends SidObjColumnOnly
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
    let buffer = '';
    for (const [key, value] of Object.entries(this)) {
      buffer = buffer.concat(buffer ? ':' : '', key, ':', value);
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
  const isString = (typeof sid === 'string' || sid instanceof String);
  if (!isString) {
    return fallback.length ? fallback[0] : {};
  }

  const idAny = '[a-zA-Z0-9_-]{4,}';
  const id = (name) => `${name}:(?<${name}>${idAny})`;
  for (const token of [
    `${id('table')}`,
    `${id('column')}`,
    `${id('table')}:${id('view')}`,
    `${id('table')}:${id('row')}`,
    `${id('table')}:${id('column')}`,
  ]) {
    result = result || sid.match(new RegExp( `^${token}$` ));
  }

  if (!result && fallback.length) {
    return fallback[0];
  }
  if (!result) {
    throw new Error(`unable to parse (invalid) sid: "${sid}"`);
  }

  return new SidObj(result.groups);
}

const tryStringToPositiveInteger = (v) => {
  if (typeof v !== 'string' && !Number.isInteger(v)) {
    return null;
  }
  const int = parseInt(v, 10);
  if (isNaN(int) || !Number.isInteger(int)) {
    return null;
  }
  if (int < 0) {
    return null;
  }
  return int;
};

/**
 * describe throttling of a SeaTable REST API response
 *
 * usage: `${new ResponseThrottleInfo(response)}`
 *
 * @param {HttpResponse|RawHttpResponse} response
 * @constructor
 */
function ResponseThrottleInfo(response) {
  this.status = response.status;

  response.getHeader || (response.getHeader = () => null);
  this.remaining = tryStringToPositiveInteger(
      response.getHeader('x-ratelimit-remaining'));
  this.limit = tryStringToPositiveInteger(
      response.getHeader('x-ratelimit-limit'));
  this.reset = tryStringToPositiveInteger(
      response.getHeader('x-ratelimit-reset'));
  this.retryAfter = tryStringToPositiveInteger(
      response.getHeader('retry-after'));

  this.hasRateLimit = null !== this.remaining && null !== this.limit && null !==
      this.reset;
  this.hasRetryAfter = null !== this.retryAfter;

  this.fmtRateLimit = function() {
    const resetDate = (new Date(this.reset * 1000)).toISOString().
        split('.')[0] + 'Z';
    return `${this.remaining}/${this.limit} @${this.reset}/${resetDate}`;
  };
  this.fmtRetry = function() {
    const retryTimestamp = Math.floor(Date.now() / 1000) + this.retryAfter;
    const retryDate = (new Date(
        Date.now() + this.retryAfter * 1000)).toISOString().split('.')[0] + 'Z';
    return `${this.retryAfter} @${retryTimestamp}/${retryDate}`;
  };

  this.toString = function() {
    if (this.hasRateLimit) {
      let buffer = '';
      if (this.hasRetryAfter) {
        buffer = `${buffer}${this.fmtRetry()} `;
      }
      return `${buffer}${this.fmtRateLimit()}`;
    } else if (this.hasRetryAfter) {
      return this.fmtRetry();
    }
    return null;
  };
}

module.exports = {
  format,
  sidParse,
  SidObj,
  ResponseThrottleInfo,
};
