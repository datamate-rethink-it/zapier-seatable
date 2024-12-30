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
const intern_asset_columns = require("./triggers/intern_asset_columns");

// create actions
const row = require("./creates/row");

// search

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
    [intern_asset_columns.key]: intern_asset_columns,
  },

  searches: {},

  creates: {
    [row.key]: row,
  },

  resources: {},
};
