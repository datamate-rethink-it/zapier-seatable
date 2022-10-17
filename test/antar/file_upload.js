/* globals describe it */
'use strict';

require('should');
const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const ctx = require('../../src/ctx');
const {ZapBundle: ZapBundle} = require('../../src/ctx/ZapBundle');

describe('File requirements', () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      table_view: 'table:0000:view:sx3j',
    },
  };

  /**
   * @param {Object} bundle
   * @return {Promise<ZapBundle>}
   */
  const zapBundleTester = async (bundle) => appTester(async (z, bundle) => {
    return new ZapBundle(z, bundle);
  }, bundle);

  it('should query from rows', async () => {
    const zb = await zapBundleTester(bundle);

    await zb.sqlQuery(`SELECT * FROM Files`);

    const idToDelete = 'VojnBaOyQiOuBIZBeu03qg';

    await zb.sqlQuery(`DELETE FROM Files WHERE _id = '${idToDelete}' `);
  });

  it('should have workspace_id', async () => {
    await appTester(async (z, bundle) => {
      await ctx.acquireDtableAppAccess(z, bundle);
      bundle.dtable.should.Object();
      const dtable = bundle.dtable;
      dtable.should.have.property('workspace_id');
    }, bundle);
  });

  it('should get metadata', async () => {
    await appTester(async (z, bundle) => {
      const access = await ctx.acquireDtableAppAccess(z, bundle);
      const response = await z.request({
        url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${access.dtable_uuid}/metadata/`,
        headers: {Authorization: `Token ${access.access_token}`},
      });
      const apiResponse = response.json;
      const tableMetadata = apiResponse.metadata.tables[0];

      tableMetadata.should.be.Object();
    }, bundle);
  });

  it('should have invalid token on listing assets with access_token', async () => {
    const result = await appTester(async (z, bundle) => {
      const zBundle = new ZapBundle(z, bundle);
      const dtable = await zBundle.dtable;
      // it needs user_token
      return await z.request({
        url: `${dtable.server_address}/api/v2.1/dtable-asset/${dtable.dtable_uuid}/`,
        headers: {Authorization: `Token ${dtable.access_token}`},
        skipHandleHTTPError: true,
        skipThrowForStatus: true,
      });
    }, bundle);
    result.should.be.Object();
    result.status.should.equal(401);
    result.json.detail.should.equal('Invalid token');
  });


  it('should upload file', async () => {
    await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
  });

  it('sql - should sqlQuery column keys', async () => {
    await appTester(async (z, bundle) => {
      const access = await ctx.acquireDtableAppAccess(z, bundle);

      const response = await z.request({
        method: 'POST',
        url: `${bundle.authData.server}/dtable-db/api/v1/query/${access.dtable_uuid}/`,
        headers: {Authorization: `Token ${access.access_token}`},
        body: {
          sql: 'SELECT _id, _mtime, `Picture` FROM `Table1` WHERE `Picture` IS NOT NULL ORDER BY `_mtime` DESC LIMIT 3',
          convert_keys: false,
        },
      });

      response.should.Object();
      response.should.have.property('json');
      const apiResponse = response.json;
      apiResponse.should.have.properties('success', 'results', 'metadata');

      const sqlMetadata = apiResponse.metadata;
      sqlMetadata.should.Array();
      const sqlResultSet = apiResponse.results;
      sqlResultSet.should.Array();

      // can be false on error: {error_message: "no such column: wNWg"} - requires column names, not keys
      if (!apiResponse.success) {
        apiResponse.should.have.property('error_message', 'query was not successful');
      }

      apiResponse.success.should.be.equal(true, 'query was successful');
    }, bundle);
  });
});
