'use strict';

const should = require('should');
const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const {ZapBundle} = require('../../src/ctx/ZapBundle');
const {sidParse} = require('../../src/lib/sid');

zapier.tools.env.inject();

describe('Update row', () => {
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      table_view: 'table:0000:view:2njg',
      table_row: 'table:0000:row:drzVKsJpQ8K0KRR69w0gPA',
    },
  };

  it('should have dynamic table_view input field in creates.row_update', async () => {
    const results = await appTester(App.creates.row_update.operation.inputFields[1], bundle);
    should.exist(results);
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


  it('should run creates.row_update update', async () => {
    bundle.inputDataRaw = {};
    bundle.inputData['column:0000'] = 'Herr Nicht so gut'; // name: Name
    bundle.inputData['column:b9X2'] = 'ok'; // name: OneOfSet
    bundle.inputData['column:L5UU'] = '9002'; // name: Number
    const results = await appTester(App.creates.row_update.operation.perform, bundle);
    should.exist(results);
    results.should.be.Object();
    results.should.not.be.Array();
  });

  it('should run creates.row_update exactly three spaces', async () => {
    bundle.inputDataRaw = {'column:0000': '   '}; // name: Name
    bundle.inputData['column:L5UU'] = '9002'; // name: Number
    const results = await appTester(App.creates.row_update.operation.perform, bundle);
    should.exist(results);
    results.should.be.Object();
    results.should.not.be.Array();
  });

  it('should create an object with image', async () => {
    const testBundle = JSON.parse(JSON.stringify(bundle));
    testBundle.inputData.table_view = 'table:0000:view:0000';
    testBundle.inputData['column:wNWg'] = 'https://httpbin.zapier-tooling.com/image/jpeg?/test-sample.jpg';

    /**
     * @param {Object} bundle
     * @return {Promise<ZapBundle>}
     */
    const zapBundleTester = async (bundle) => appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);

    const {row: rowId, table: tableId} = sidParse(testBundle.inputData.table_row);
    should(rowId === 'drzVKsJpQ8K0KRR69w0gPA').equals(true, `rowId to update ${rowId}`);
    const zb = await zapBundleTester(testBundle);
    const {data: {Picture: pictureBefore}} = await zb.request(`/dtable-server/api/v1/dtables/{{dtable_uuid}}/rows/${rowId}/?table_id=${tableId}`);

    const result = await appTester(App.creates.row_update.operation.perform, testBundle);

    const {data: {Picture: pictureAfter}} = await zb.request(`/dtable-server/api/v1/dtables/{{dtable_uuid}}/rows/${rowId}/?table_id=${tableId}`);

    result.should.be.an.Object();
    result.should.not.be.an.Array();
    result.should.have.property('success', true);

    should(pictureAfter.length).be.equals(1 + pictureBefore.length, `picture has been uploaded (updated)`);
  }).timeout(40000);
});
