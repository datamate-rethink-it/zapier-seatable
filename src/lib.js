"use strict";

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
    return result.join("");
  };
}

const tryStringToPositiveInteger = (v) => {
  if (typeof v !== "string" && !Number.isInteger(v)) {
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
      response.getHeader("x-ratelimit-remaining"));
  this.limit = tryStringToPositiveInteger(
      response.getHeader("x-ratelimit-limit"));
  this.reset = tryStringToPositiveInteger(
      response.getHeader("x-ratelimit-reset"));
  this.retryAfter = tryStringToPositiveInteger(
      response.getHeader("retry-after"));

  this.hasRateLimit = null !== this.remaining && null !== this.limit && null !==
      this.reset;
  this.hasRetryAfter = null !== this.retryAfter;

  this.fmtRateLimit = function() {
    const resetDate = (new Date(this.reset * 1000)).toISOString().
        split(".")[0] + "Z";
    return `${this.remaining}/${this.limit} @${this.reset}/${resetDate}`;
  };
  this.fmtRetry = function() {
    const retryTimestamp = Math.floor(Date.now() / 1000) + this.retryAfter;
    const retryDate = (new Date(
        Date.now() + this.retryAfter * 1000)).toISOString().split(".")[0] + "Z";
    return `${this.retryAfter} @${retryTimestamp}/${retryDate}`;
  };

  this.toString = function() {
    if (this.hasRateLimit) {
      let buffer = "";
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
  ResponseThrottleInfo,
};
