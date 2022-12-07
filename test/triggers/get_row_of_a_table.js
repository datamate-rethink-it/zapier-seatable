require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Trigger - get_row_of_a_table', () => {
  zapier.tools.env.inject();

  it('should get an array', async () => {
    const bundle = {
      authData: {
        server: process.env.SERVER,
        api_token: process.env.API_TOKEN,
      },
      inputData: {table_name: 'table:0000'},
    };

    const results = await appTester(App.triggers.get_row_of_a_table.operation.perform, bundle);
    results.should.be.an.Array();
  });
});
