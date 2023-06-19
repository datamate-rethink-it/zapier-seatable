const ctx = require("../ctx");
const _ = require("lodash");

/**
 * perform
 *
 * internal fetch of all views of a table
 *
 * NOTE: the view drop-down input field now does its own API call,
 *       deprecating this internal trigger.
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<{json: {id: string, Name: string}}[]>}
 */
const perform = async (z, bundle) => {
  const metadata = await ctx.acquireTableMetadata(z, bundle);

  return _.map(metadata.views, (o) => ({
    id: `table:${metadata._id}:view:${o._id}`,
    Name: o.name,
  }));
};

module.exports = {
  key: "get_views_of_a_table_of_a_base",
  noun: "Table View",
  display: {
    label: "Hidden: Get views of a table of a base",
    description: "Internal trigger to get the views of a table of a base.",
    hidden: true,
    important: false,
  },
  operation: {
    perform,
    sample: {id: "table:0000:view:0000", name: "Default View"},
    outputFields: [{key: "id"}, {key: "name"}],
  },
};
