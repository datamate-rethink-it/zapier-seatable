require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const ctx = require('../../src/ctx');
const {ZapBundle} = require('../../src/ctx/ZapBundle');
const {ZapSql, SqlQuoteError, SqlResult, sqlQuote, sqlColumnTypeMap} = require('../../src/ctx/ZapSql');
const should = require('should');

describe('ctx - ZapSql', () => {
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
    const result = await appTester(async (z, bundle) => {
      return new ZapSql(
          new ZapBundle(z, bundle),
          `SELECT * FROM Table1 LIMIT 3`,
      );
    }, bundle);
    result.should.be.Object();
    result.should.be.instanceOf(ZapSql);
  });

  it('should throw on quoting backtick', async () => {
    let error;
    try {
      sqlQuote('oh`snap');
    } catch (e) {
      error = e;
    }
    should(error).be.instanceOf(SqlQuoteError);
  });

  it('should run sql query', async () => {
    const zSql = await appTester(async (z, bundle) => {
      return new ZapSql(
          new ZapBundle(z, bundle),
          'SELECT * FROM Table1 LIMIT 3',
      );
    }, bundle);
    const result = await zSql.run();
    result.should.be.Object();
    result.should.be.instanceOf(SqlResult, 'is sql result');
    result.should.have.properties('result', 'convert_keys', 'context');
    result.success.should.be.equal(true, 'success');
    result.results.length.should.equal(3);
  });

  it('should guard sqlColumnTypeMap column-type', async () => {
    const typeMap = sqlColumnTypeMap;
    const types = Object.keys(ctx.struct.columns.types);

    for (const key of Object.keys(typeMap)) {
      should(types.includes(key)).be.true(`key '${key}' not in ctx.struct.columns.types`);
    }
  });
});
