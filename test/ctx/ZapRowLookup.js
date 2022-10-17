require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const {ZapBundle} = require('../../src/ctx/ZapBundle');
const {ZapRowLookup, RowLookupResult} = require('../../src/ctx/ZapRowLookup');
const should = require('should');

describe('ctx - ZapRowLookup', () => {
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
    const zapRowLookup = await appTester(async (z, bundle) => {
      return new ZapRowLookup(new ZapBundle(z, bundle));
    }, bundle);
    zapRowLookup.should.be.Object();
    zapRowLookup.should.be.instanceOf(ZapRowLookup);
  });

  it('should lookup row by column', async () => {
    const zb = await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
    const zapRowLookup = new ZapRowLookup(zb);

    // use-case from perform to get rowId to then update the row

    const table = (await zb.metadata).tables[1];
    table.name.should.be.equal('Files', 'right 2nd table (Files)');
    // column:0000 Name (auto-number)
    // column:4Z85 size (number)
    // column:K59H Row-Key (text)
    const column = 'column:0000';
    const value = 'Upload-00397';

    const rowLookupResult = await zapRowLookup.byColumn(table, column, value);
    rowLookupResult.should.be.Object();
    should(rowLookupResult).be.instanceOf(RowLookupResult, 'is RowLookupResult');
    rowLookupResult.should.have.properties('count', 'countResult', 'rowIdResult');
    should(rowLookupResult.count).equals(1, 'count is exactly one row');
    // testing sqlResult mainly, ported from ZapSql test-case, mood
    rowLookupResult.rowIdResult.result.success.should.be.equal(true, 'success');
    rowLookupResult.rowIdResult.result.results.length.should.equal(1);
  });
});
