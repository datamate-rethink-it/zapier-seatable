'use strict';

const should = require('should');
const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const {ZapBundle} = require('../../src/ctx/ZapBundle');
const {ZapBundleFileUploader} = require('../../src/ctx/ZapBundleFileUploader');
const http = require('https');

describe('ctx - ZapBundleFileUploader', () => {
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

  it('should resolve promise', async () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('foo');
      }, 100);
      setTimeout(() => {
        reject(new Error('punk!'));
      }, 200);
    });
    const result = await promise;
    should(result).equal('foo');
  });

  it('should resolve request filename', async () => {
    let called = false;
    const url = 'https://httpbin.zapier-tooling.com/image/jpeg';
    const promise = new Promise((resolve, reject) => {
      http.request(url, (res) => {
        // We can risk missing the first n bytes if we don't pause!
        res.pause();
        // To get the response, add a listener for 'response' to the request object.
        // 'response' will be emitted from the request object when the response headers have been received.
        // The 'response' event is executed with one argument which is an instance of http.IncomingMessage.
        // https://nodejs.org/api/http.html#event-response
        //
      }).on('error', reject).on('response', (incomingMessage) => {
        if (called) {
          throw new Error(`response:error: event 'response' already called: ${incomingMessage.rawHeaders}`);
        }
        called = true;
        console.log('response:content-disposition(headers)', incomingMessage.headers);
        const contentDisposition = incomingMessage.headers['content-disposition'];
        console.log('response:content-disposition(full)', contentDisposition);
        const result = contentDisposition?.match(/^attachment; filename="(?<filename>[^"]+)"$/);
        console.log('response:content-disposition(match)', result);
        resolve(incomingMessage);
      }).end();
    });
    const result = await promise;
    called.should.equal(true, 'response event was called');
    should(called).equals(true, 'response event was called');
    should(result).not.be.ok;
    should(result.headers['content-disposition']).be.undefined();
  });

  it('should create (new)', async () => {
    const zb = await zapBundleTester(bundle);

    const zapBundleFileUploader = new ZapBundleFileUploader(zb);
    zapBundleFileUploader.should.be.instanceOf(Object);
    zapBundleFileUploader.should.be.instanceOf(ZapBundleFileUploader);
  });

  it('should create (zb.fileUploader)', async () => {
    const zb = await zapBundleTester(bundle);

    const fileUploader = zb.fileUploader();
    fileUploader.should.be.instanceOf(Object);
    fileUploader.should.be.instanceOf(ZapBundleFileUploader);
  });

  it('should get upload link', async () => {
    const zb = await zapBundleTester(bundle);
    const fileUploader = zb.fileUploader();

    const uploadLink = await fileUploader.getUploadLink();
    uploadLink.should.be.instanceOf(Object);
    uploadLink.should.have.properties('upload_link', 'parent_path',
        'file_relative_path', 'img_relative_path');
  });

  it('should post file to upload link', async () => {
    const zb = await zapBundleTester(bundle);
    const fileUploader = zb.fileUploader();

    const uploadUrl = 'https://httpbin.zapier-tooling.com/xml';
    const uploadFilename = 'slides6.xml';
    const isFilenameAuthoritative = true;
    const uploadAssetType = 'file';

    const uploadLink = await fileUploader.getUploadLink();

    const uploadResult = await fileUploader.postUploadToLinkFromUrl(
        uploadUrl, uploadFilename, isFilenameAuthoritative, uploadLink, uploadAssetType, true,
    );
    // uploadResult {
    //   name: 'PMSeaTable (2).png',
    //   id: '9f9da5cd8c14543925d441b8aa2f281667218d7b',
    //   size: 162215
    // }
    // z.console.timeLog(logTag, 'uploadResult', uploadResult);

    uploadResult.should.be.instanceOf(Object);
    uploadResult.should.have.properties('name', 'id', 'size');

    const fileUrl = await fileUploader.getAssetUrlFromUpload(uploadLink, uploadResult.name, uploadAssetType);
    fileUrl.should.be.String();
    fileUrl.length.should.be.greaterThan(20);
    fileUrl.should.endWith(`/${uploadFilename}`);
    fileUrl.should.match(/\/workspace\/\d+\/asset\//);

    const columnAssetData = await fileUploader.getAssetData(uploadLink, uploadResult, uploadAssetType);
    // columnAssetData https://cloud.seatable.io/workspace/1105/asset/20a2d8d0-b5fc-4c74-8607-86a5cc874563/images/2023-01/PMSeaTable (2).png
    // z.console.timeLog(logTag, 'columnAssetData', columnAssetData);

    if ('image' === uploadAssetType) {
      columnAssetData.should.be.String();
    } else {
      columnAssetData.should.be.Object();
      columnAssetData.should.have.properties('name', 'size', 'type', 'url');
      columnAssetData.name.should.be.String();
      columnAssetData.size.should.be.Number();
      columnAssetData.type.should.equal('file');
      columnAssetData.url.should.be.String();
    }

    const columnName = uploadAssetType === 'image' ? 'Picture' : 'File';
    const uploadColumnField = {
      [columnName]: [columnAssetData],
    };

    const dtable = await zb.dtable;
    const {z} = zb;
    const response = await z.request({
      url: `${dtable.server_address}/dtable-server/api/v1/dtables/${dtable.dtable_uuid}/rows/`,
      method: 'POST',
      headers: {Authorization: `Token ${dtable.access_token}`},
      body: {
        table_name: 'Table1',
        row: {
          ...uploadColumnField,
          ...uploadResult,
        },
      },
      skipHandleHTTPError: true,
      skipThrowForStatus: true,
    });
    const insertRowResult = response.data;
    insertRowResult.should.be.Object();
  }).timeout(8000);

  it('shouldn\'t - with api_token based authentication - list base asset directories and files', async () => {
    // test for implementation
    const zb = await zapBundleTester(bundle);
    const dtable = await zb.dtable;
    const {z} = zb;

    const response = await z.request({
      url: `${dtable.server_address}/api/v2.1/dtable-asset/${dtable.dtable_uuid}/?parent_dir=/`,
      headers: {Authorization: `Token ${dtable.access_token}`},
      skipHandleHTTPError: true,
      skipThrowForStatus: true,
    });

    response.status.should.equal(401);
    response.data.should.be.Object();
    response.data.should.have.property('detail');
    response.data.detail.should.equal('Invalid token');
  });

  it('should have uploadUrlAssetPromise() method', async () => {
    const zb = await zapBundleTester(bundle);
    const fileUploader = zb.fileUploader();
    const uploadUrl = 'https://httpbin.zapier-tooling.com/image/jpeg?/test-sample.jpg';
    const columnType = 'image';
    const columnAssetData = await fileUploader.uploadUrlAssetPromise(uploadUrl, columnType);
    should(columnAssetData !== undefined).equals(true);
    columnAssetData.should.be.instanceOf(String);
    const matcher= /[/]test-sample( \(\d+\))?\.jpg$/;
    columnAssetData.should.match(matcher, `is asset url from image: ${columnAssetData}`);
  }).timeout(20000);

  it('should have getUploadFilenameFromUrl() behaviour to this test-spec', async () => {
    const zb = await zapBundleTester(bundle);
    const fileUploader = zb.fileUploader();

    const unnamedAttachment = 'Unnamed attachment';
    const cases = [
      {
        pass: true,
        url: 'https://httpbin.zapier-tooling.com/image/jpeg?/test-sample.jpg',
        expected: 'test-sample.jpg',
      },
      {
        pass: false,
        url: 'https://httpbin.zapier-tooling.com/image/jpeg',
      },
      {
        pass: false,
        url: '',
      },
      {
        pass: false,
        url: require('../fixture/data-uri').animated_gif,
      },
    ];

    for (const [index, value] of cases.entries()) {
      const {url, pass, expected = unnamedAttachment} = value;
      should(pass === fileUploader.testFilename(url)).equals(true, `pass - test filename (case #${index}): ${url} (${pass})`);
      const actual = fileUploader.getUploadFilenameFromUrl(url);
      should('string' === typeof actual).equals(true, `pass - string type (case #${index}): ${url}`);
      should(unnamedAttachment !== actual).equals(pass, `pass - fallback string (case #${index}): ${url}`);
      actual.should.be.eql(expected, `URL (case #${index}): ${url} (${expected})`);
    }
  });
});
