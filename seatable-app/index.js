const {
  config: authentication,
  befores = [],
  afters = [],
} = require("./authentication");

const hydrators = require("./hydrators");

// triggers
const new_updated_row = require("./triggers/new_updated_row");
const new_row = require("./triggers/new_row");
const new_asset = require("./triggers/new_asset");

// internal
const intern_tables = require("./triggers/intern_tables");
const intern_views = require("./triggers/intern_views");
const intern_rows = require("./triggers/intern_rows");
const intern_asset_columns = require("./triggers/intern_asset_columns");
const intern_search_columns = require("./triggers/intern_search_columns");

// create actions
const row = require("./creates/row");
const row_update = require("./creates/row_update");
const row_delete = require("./creates/row_delete");
const row_lock = require("./creates/row_lock");
const row_unlock = require("./creates/row_unlock");
const api_request = require("./creates/api_request");

// search
const find_row = require("./searches/find_row");
const find_many_rows = require("./searches/find_many_rows");

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  authentication,

  hydrators,

  beforeRequest: [...befores],
  afterResponse: [...afters],

  triggers: {
    [new_updated_row.key]: new_updated_row,
    [new_row.key]: new_row,
    [new_asset.key]: new_asset,
    [intern_tables.key]: intern_tables,
    [intern_views.key]: intern_views,
    [intern_rows.key]: intern_rows,
    [intern_asset_columns.key]: intern_asset_columns,
    [intern_search_columns.key]: intern_search_columns,
  },

  creates: {
    [row.key]: row,
    [row_update.key]: row_update,
    [row_delete.key]: row_delete,
    [row_lock.key]: row_lock,
    [row_unlock.key]: row_unlock,
    [api_request.key]: api_request,
  },

  searches: {
    [find_row.key]: find_row,
    [find_many_rows.key]: find_many_rows,
  },
  searchOrCreates: {
    [find_row.key]: {
      key: find_row.key,
      display: {
        label: "Find or Create a Row",
        description: "(intentionally left blank)",
      },
      search: find_row.key,
      create: row.key,
    },
  },
  resources: {},
};
