/* globals describe it */
const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('Create row', () => {
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      'table_name': 'table:0000',
      'column:0000': 'Herr Rossi',
      'Name': 'Herr Rossi und Gaston', // must be ignored, pre 1.0.3, now column:0000 key is preferred to read from input-data if exists
    },
  };

  it('should have dynamic output fields', async () => {
    const results = await appTester(App.creates.row.operation.outputFields[0], bundle);
    should.exist(results);
    results.should.be.an.Array();
    results.length.should.be.above(2);
    results[0].should.have.properties('key', 'label');
    results[0].key.should.eql('row_id');
    results[0].label.should.eql('ID');
    results[1].should.have.properties('key', 'label');
    results[1].key.should.eql('column:0000');
  }).timeout(20000);

  it('should have file output field', async () => {
    const result = await appTester(App.creates.row.operation.outputFields[0], bundle);
    should.exist(result);
    result.should.be.an.Array();
    result.length.should.be.above(3);
    const [,, outPicture] = result;
    outPicture.should.have.property('key', 'column:wNWg');
    outPicture.should.have.property('label', 'Picture');
  });

  it('should get dynamic input fields', async () => {
    const result = await appTester(App.creates.row.operation.inputFields[1], bundle);
    result.should.be.an.Array();
    result.length.should.be.above(1);
    result[0].should.have.properties('key', 'label');
    result[0].should.containEql({key: 'column:0000', label: 'Name'});
  });

  it('should get file input field', async () => {
    const result = await appTester(App.creates.row.operation.inputFields[1], bundle);
    result.should.be.an.Array();
    result.length.should.be.above(2);
    const [, inPicture, inFile] = result;
    inPicture.should.have.property('type', 'file');
    inFile.should.have.property('type', 'file');
    result[0].should.containEql({key: 'column:0000', label: 'Name'});
  });

  it('should create an object', async () => {
    const result = await appTester(App.creates.row.operation.perform, bundle);
    result.should.not.be.an.Array();
    result.should.have.property('row_id');
    result.should.have.property('column:0000');
  });

  it('should create an object with image', async () => {
    const testBundle = JSON.parse(JSON.stringify(bundle));
    testBundle.inputData['column:wNWg'] = 'https://httpbin.zapier-tooling.com/image/jpeg?/test-sample.jpg';

    const result = await appTester(App.creates.row.operation.perform, testBundle);
    result.should.not.be.an.Array();
    result.should.have.property('column:wNWg');
    const outImage = result['column:wNWg'];
    should(outImage).not.be.eql(null, 'image must be set');
  }).timeout(40000);
});
