require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

const _CONST = require('../src/const');
const ctx = require('../src/ctx');

describe('serverInfo', () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      table_view: 'table:0000:view:0000',
      [ctx.FEATURE_NO_AUTH_ASSET_LINKS]: true,
    },
  };

  it('should acquire server info', async () => {
    bundle.serverInfo = undefined;
    await appTester(async (z, bundle) => {
      const result = await ctx.acquireServerInfo(z, bundle);
      result.should.be.Object();
      result.should.have.properties('version', 'edition');
      const knownVersions = [
        '3.1.13', // 2022-09-12
        '3.2.5', // 2022-10-06
        '3.3.7', // 2023-01-03
      ];
      knownVersions.indexOf(result.version).should.greaterThan(-1, `${result.version} (known are: ${knownVersions}; this test fails when the server version changes on cloud.seatable.io, extend known versions then.)`);
      result.edition.should.eql('enterprise edition', 'cloud.seatable.io runs enterprise edition');
    }, bundle);
  });

  it('should error server info', async () => {
    bundle.serverInfo = undefined;
    bundle.authData.server = 'https://seatable.io/?';
    await appTester(async (z, bundle) => {
      let result;
      try {
        result = await ctx.acquireServerInfo(z, bundle);
      } catch (e) {
        result = e;
      }
      result.should.be.Object();
      result.should.have.properties('stack', 'message');
      result.message.should.match(_CONST.STRINGS['seatable.error.no-server-info'](bundle.authData.server));
    }, bundle);
  });
});
