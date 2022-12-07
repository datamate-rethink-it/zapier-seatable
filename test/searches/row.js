/* globals describe it */
const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('Search row', () => {
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      search_column: 'column:0000',
      search_value: 'le-table-row',
    },
  };

  it('should run searches.row', async () => {
    const results = await appTester(App.searches.row.operation.perform, bundle);
    results.should.be.Array();
    results.should.have.lengthOf(1);
    results[0].should.be.Object();
    results[0].should.containEql({'column:0000': 'le-table-row'});
    results[0].should.have.properties('row_id', 'row_mtime');
  });

  it('should not search unsupported column type', async () => {
    const b = bundle;
    b.inputData.table_name = 'table:P8z8';
    b.inputData.search_column = 'column:5fV6';
    try {
      await appTester(App.searches.row.operation.perform, b);
    } catch (e) {
      e.should.be.Object();
      e.should.isPrototypeOf(
          'AppError',
      );
      e.message.should.be.String();
      const json = JSON.parse(e.message);
      json.message.should.match(
          /^Search in Long Text field named "LongTextColumn" is not supported, please choose a different column\.$/,
      );
    }
  });

  it('should have output fields for searches.row', async () => {
    const results = await appTester(App.searches.row.operation.outputFields[0], bundle);
    should.exist(results);
    results.should.be.Array();
    results[0].should.be.Object();
    results[0].should.eql({key: 'row_id', label: 'ID'});
    results[1].should.eql({key: 'row_mtime', label: 'Last Modified'});
    results[2].should.eql({key: 'column:0000', label: 'Name'});
  });

  it('should hide non-searchable columns', async () => {
    const results = await appTester(App.searches.row.operation.inputFields[1], bundle);
    should.exist(results);
    results.should.be.Object();
    results.should.have.property('choices');
    results.choices.should.not.have.property('column:486c');
  });

  it('should have dynamic input field for search-value', async () => {
    const results = await appTester(App.searches.row.operation.inputFields[2], bundle);
    should.exist(results);
    results.should.have.property('key', 'search_value');
  });
});
