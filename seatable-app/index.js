const {
  config: authentication,
  befores = [],
  afters = [],
} = require("./authentication");

//const hydrators = require("./hydrators");

// triggers
const new_updated_row = require("./triggers/new_updated_row");

// internal
const intern_tables = require("./triggers/intern_tables");
const intern_views = require("./triggers/intern_views");

const getNewRowJs = require("./triggers/new_row_js");

// create actions

// search

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  authentication,

  //hydrators,

  beforeRequest: [...befores],
  afterResponse: [...afters],

  triggers: {
    [new_updated_row.key]: new_updated_row,
    [intern_tables.key]: intern_tables,
    [intern_views.key]: intern_views,
    [getNewRowJs.key]: getNewRowJs
  },

  searches: {},

  creates: {},

  resources: {},
};
