const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const {ZapBundle} = require('../../src/ctx/ZapBundle');
const {ZapBundleFileHandler} = require('../../src/ctx/ZapBundleFileHandler');

describe('ctx - ZapBundleFileHandler', () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      file_column: 'column:wNWg',
    },
  };

  /**
   * @param {Object} bundle
   * @return {Promise<ZapBundle>}
   */
  const zapBundleTester = async (bundle) => appTester(async (z, bundle) => {
    return new ZapBundle(z, bundle);
  }, bundle);

  it('should create (new)', async () => {
    const zb = await zapBundleTester(bundle);

    const zapBundleFileHandler = new ZapBundleFileHandler(zb);
    zapBundleFileHandler.should.be.instanceOf(Object);
    zapBundleFileHandler.should.be.instanceOf(ZapBundleFileHandler);
  });

  it('should create (ZapBundle)', async () => {
    const zb = await zapBundleTester(bundle);

    const fileHandler = zb.fileHandler();
    fileHandler.should.be.instanceOf(Object);
    fileHandler.should.be.instanceOf(ZapBundleFileHandler);
  });

  it('should list asset columns', async () => {
    const zb = await zapBundleTester(bundle);
    const fileHandler = zb.fileHandler();

    const assetColumns = await fileHandler.listAssetColumns();

    assetColumns.should.be.Array();
    assetColumns.length.should.be.greaterThan(0, 'need at least one entry for assertion');

    const assetColumn = assetColumns.shift();
    assetColumn.should.be.Object();
    assetColumn.should.have.properties('column', 'table', 'sid');
  }).timeout(4000);

  it('should find sid in asset columns', async () => {
    const zb = await zapBundleTester(bundle);
    const fileHandler = zb.fileHandler();
    const assetColumns = await fileHandler.listAssetColumns();
    const {sid} = assetColumns.shift();

    const assetColumn = await fileHandler.findAssetColumn(sid);
    assetColumn.should.have.properties('column', 'table', 'sid');
    assetColumn.sid.should.be.equal(sid);

    const {table, column, sid: resultSid} = await fileHandler.findAssetColumn('table:xxx:column:yyy') || {};
    should(table).not.be;
    should(column).not.be;
    should(resultSid).not.be;
  });

  it('should query assets', async () => {
    const zb = await zapBundleTester(bundle);
    const fileHandler = zb.fileHandler();

    const result = await fileHandler.queryRowAssets();
    result.should.be.instanceOf(Array);

    result.length.should.be.greaterThan(322);
  });
});
