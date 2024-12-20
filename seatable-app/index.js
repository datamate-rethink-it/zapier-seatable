const {
  config: authentication,
  befores = [],
  afters = [],
} = require("./authentication");

//const hydrators = require("./hydrators");

// triggers
const new_updated_row = require("./triggers/new_updated_row");

// internal

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
  },

  searches: {},

  creates: {},

  resources: {},
};
