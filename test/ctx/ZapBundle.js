require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const {ZapBundle: ZapBundle} = require('../../src/ctx/ZapBundle');

describe('ctx - ZapBundle', () => {
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

  it('should create', async () => {
    const zb = await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
    zb.should.be.instanceOf(Object);
    zb.should.be.instanceOf(ZapBundle);
  });

  it('should authenticate against base', async () => {
    const zb = await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
    const result = await zb.dtableCtx;
    result.should.be.Object();
    result.should.have.properties('access_token', 'dtable_name', 'dtable_uuid', 'workspace_id', 'server_address');
    result.should.be.instanceOf(Object, 'is plain object');
  });

  it('should get metadata', async () => {
    const zb = await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
    const result = await zb.metadata;
    result.should.be.Object();
    result.should.have.properties('format_version', 'settings', 'tables', 'version');
    result.should.be.instanceOf(Object, 'is plain object');
  });
});
