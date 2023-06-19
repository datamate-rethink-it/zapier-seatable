/*
 * seatable api constants for zapier
 *
 * Written by Tom Klingenberg
 * Copyright 2022 SeaTable GmbH, Mainz
 */
const {format} = require("./lib");

const FEATURE_MTIME_FILTER = "feature_row_modification_time_limiter";
const FEATURE_NO_AUTH_ASSET_LINKS = "feature_non_authorized_asset_downloads";
const FEATURE_HTTP_MIDDLEWARE_ALWAYS_LOG_THROTTLING = "feature_http_middleware_always_log_throttling";

const FEATURE = {
  [FEATURE_MTIME_FILTER]: {
    key: FEATURE_MTIME_FILTER,
    enabled: false,
    minutes: 216,
  },
};


const STRINGS = {
  "seatable.error.app-access-token":
    format`Failed to get app-access on SeaTable server at "${0}".`,
  "seatable.error.base-forbidden":
    "Your API Key is invalid. Please reconnect your account.",
  "seatable.error.base-deleted":
    format`SeaTable base has been deleted: ${0}.\nIf deletion was unindented, restore the base from trash.\nIf the base has moved, provide an API-Token of the new base by reconnecting the Zap.`,
  "seatable.error.no-server-info":
    format`Failed to connect to SeaTable server at "${0}". Please check the server address.`,
  "http.error.status403":
    "403 Forbidden: This Zap is not allowed to talk to SeaTable." +
    " Most of the time this happens if you use an API-Token with" +
    " read-only permission in a write operation.",
  "http.error.status429":
    "429 Too Many Requests: This Zap is running into SeaTable API" +
    " request limits.",
  "http.error.status4xx5xxFallback":
    "Unexpected status code",
};

module.exports = {
  FEATURE,
  FEATURE_HTTP_MIDDLEWARE_ALWAYS_LOG_THROTTLING,
  FEATURE_MTIME_FILTER,
  FEATURE_NO_AUTH_ASSET_LINKS,
  STRINGS,
};
