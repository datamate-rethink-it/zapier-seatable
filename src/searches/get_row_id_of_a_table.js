// const ctx = require('../ctx');
// const _ = require('lodash');

// /**
//  * perform
//  *
//  * finds a particular row by default column value in table
//  *
//  * @param {ZObject} z
//  * @param {Bundle} bundle
//  * @return {Promise<{id: {string}, name: {string}}[]>}
//  */
// const perform = async (z, bundle) => {
//   const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);

//   bundle.inputData.search_column = 'column:0000';
//   // + bundle.inputData.search_value
//   // + bundle.inputData.table_name

//   /** @type {ZapierZRequestResponse} */
//   const response = await z.request({
//     url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/filtered-rows/`,
//     headers: {Authorization: `Token ${bundle.dtable.access_token}`},
//     params: ctx.requestParamsSid(bundle.inputData.table_name),
//     allowGetBody: true,
//     body: {'filters': [await ctx.filter(z, bundle, 'internal')]},
//   });

//   let rows = response.data.rows;

//   const tableMetadata = await ctx.acquireTableMetadata(z, bundle);

//   rows = _.map(_.map(rows, (o) => ctx.mapColumnKeys(tableMetadata.columns, o)), (r) => {
//     return {
//       id: `table:${tableMetadata._id}:row:${r.row_id}`,
//       name: r['column:0000'], // known: r['column:0000'] can be "undefined"
//     };
//   },
//   );

//   return rows;
// };

// module.exports = {
//   key: 'get_row_id_of_a_table',
//   noun: 'Row',
//   display: {
//     label: 'Locate a Row',
//     description: 'Locates a row by default column in table for update',
//     important: false,
//   },
//   operation: {
//     perform,
//     inputFields: [
//       {
//         key: 'table_name',
//         required: true,
//         label: 'Table',
//         helpText: 'Pick a SeaTable table to locate a row in.',
//         type: 'string',
//         dynamic: 'get_tables_of_a_base.id.name',
//       },
//       {
//         key: 'search_value',
//         required: true,
//         type: 'string',
//         label: 'Search Value',
//         helpText: 'The unique default column value to search for.',
//       },
//     ],
//     sample: {'id': 'table:0000:row:xYz...', 'name': 'Name1'},
//     outputFields: [{key: 'id'}, {key: 'name'}],
//   },
// };
