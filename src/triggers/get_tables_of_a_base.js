const ctx = require('../ctx');
const _ = require('lodash');

/**
 * perform
 *
 * internal fetch all tables of a base
 *
 * @param z
 * @param bundle
 * @return {Promise<{json: {id: string, Name: string}}[]>}
 */
const perform = async (z, bundle) => {
  const metadata = await ctx.acquireMetadata(z, bundle);

  return _.map(metadata.tables, (o) => ({
    id: `table:${o._id}`,
    name: `${o.name} (${bundle.dtable.dtable_name})`,
  }));
};

module.exports = {
  key: 'get_tables_of_a_base',
  noun: 'Table',
  display: {
    label: 'Hidden: Get tables of a base',
    description: 'Internal trigger to get the tables of a base.',
    hidden: true,
    important: false,
  },
  operation: {
    perform,
    sample: {id: 'table:0000', name: 'Table1'},
    outputFields: [{key: 'id'}, {key: 'name'}],
  },
};
