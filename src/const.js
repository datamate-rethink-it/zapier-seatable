/*
 * seatable api constants for zapier
 *
 * Written by Tom Klingenberg
 * Copyright 2022 SeaTable GmbH, Mainz
 */

const FEATURE_MTIME_FILTER = 'feature_row_modification_time_limiter';
const FEATURE_NO_AUTH_ASSET_LINKS = 'feature_non_authorized_asset_downloads';
const FEATURE_HTTP_MIDDLEWARE_ALWAYS_LOG_THROTTLING =
  'feature_http_middleware_always_log_throttling';

const FEATURE = {
  [FEATURE_MTIME_FILTER]: {
    key: FEATURE_MTIME_FILTER,
    enabled: false,
    minutes: 216,
  },
};

const STRINGS = {
  'http.error.status403':
    '403 Forbidden: This Zap is not allowed to talk to SeaTable.' +
    ' Most of the time this happens if you use an API-Token with' +
    ' read-only permission in a write operation.',
  'http.error.status429':
    '429 Too Many Requests: This Zap is running into SeaTable API' +
    ' request limits.',
  'http.error.status4xx5xxFallback': 'Unexpected status code',
};

module.exports = {
  FEATURE,
  FEATURE_HTTP_MIDDLEWARE_ALWAYS_LOG_THROTTLING,
  FEATURE_MTIME_FILTER,
  FEATURE_NO_AUTH_ASSET_LINKS,
  STRINGS,
};
