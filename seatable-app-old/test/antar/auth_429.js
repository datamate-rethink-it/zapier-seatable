/* globals describe it */
"use strict";

const should = require("should");
const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

const ctx = require("../../src/ctx");

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @param {function} returnFilter
 * @param {number} numberOfSegments
 * @param {number} numberOfStepsPerSegment
 * @return {Promise<*>}
 */
const brute429onAuth = async (z, bundle, returnFilter = null, numberOfSegments = 10, numberOfStepsPerSegment = 10) => {
  returnFilter || (returnFilter = (response, index) => response.status === 429);

  const start = new Date();
  let delta = (new Date).valueOf() - start.valueOf();
  let index = -1;
  for (let segment = 0; segment < numberOfSegments; segment++) {
    console.log(`${segment + 1}. segment (index=${index + 1}):`);
    const promises = [];
    for (let segmentStep = 0; segmentStep < numberOfStepsPerSegment; segmentStep++) {
      promises.push(z.request({
        url: `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
        headers: {Authorization: `Token ${bundle.authData.api_token}`},
        skipThrowForStatus: true,
        skipHandleHTTPError: true,
      }));
    }
    const responses = await Promise.all(promises);
    delta = (new Date).valueOf() - start.valueOf();
    console.log(`${index} ${delta}: (${responses.length})`, responses.map((r) => r.status || null).join(", "));
    for (const response of responses) {
      index++;
      if (returnFilter(response, index)) {
        return response;
      }
    }
  }
};
/**
 *
 * @param {Bundle} bundle
 * @param {?function} returnFilter
 * @param {?number} numberOfSegments
 * @param {?number} numberOfStepsPerSegment
 * @return {Promise<*>}
 */
const appTestBrute429onAuth = async (
    bundle,
    returnFilter = null,
    numberOfSegments = 10,
    numberOfStepsPerSegment = 10,
) => {
  return await appTester(
      async (z, bundle) => brute429onAuth(z, bundle, returnFilter, numberOfSegments, numberOfStepsPerSegment),
      bundle,
  );
};
((nocall) => null)(appTestBrute429onAuth);

describe("Auth 429", () => {
  zapier.tools.env.inject();
  // bundle.authData.server = bundle.authData.server.replace(/\/+$/, '');
  const bundle = {
    authData: {
      server: process.env.SERVER.replace(/\/+$/, ""),
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: "table:0000",
      table_view: "table:0000:view:sx3j",
    },
  };

  it("should get server-info first to verify it is a seatable server", async () => {
    await appTester(
        async (z, bundle) => {
          const response = await z.request({
            url: `${bundle.authData.server}/server-info/`,
          });
          response.should.be.Object();
          response.status.should.be.equal(200);
          response.should.have.property("json");
          response.json.should.have.properties(...["version", "edition"]);
        },
        bundle,
    );
  });

  it("should do get_row_of_a_table in a 429 situation", async () => {
    await appTester(
        async (z, bundle) => {
        // put the application into 429 state on the real API
          const result = await brute429onAuth(z, bundle, null, 10, 300);
          should(result.status).eql(429);
          const seconds = result.getHeader("retry-after");
          should(seconds).greaterThan(10);

          // get row of a table
          let results;
          try {
            results = await appTester(App.triggers.get_row_of_a_table.operation.perform, bundle);
            results.should.be.an.Array();
          } catch (e) {
            results = e;
          }
          results.should.be.instanceOf(z.errors.ThrottledError);
        },
        bundle,
    );
  }).timeout(40000);

  it("should make z.request() for auth", async () => {
    const result = await appTester(async (z, bundle) => {
      return await z.request({
        url: `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
        headers: {Authorization: `Token ${bundle.authData.api_token}`},
        skipThrowForStatus: true,
        skipHandleHTTPError: true,
      });
    }, bundle);
    console.log(result);
  });

  it("should make ctx.acquireTableMetadata() and return bundle", async () => {
    const result = await appTester(async (z, bundle) => {
      await ctx.acquireTableMetadata(z, bundle);
      return bundle;
    }, bundle);
    console.log(result);
  });

  it("should make z.request() provoke status 429 on app-access-token", async () => {
    const results = await appTester(async (z, bundle) => {
      const start = new Date();
      let delta = (new Date).valueOf() - start.valueOf();
      let step = 1;
      for (let segment = 0; segment < 10; segment++) {
        console.log(`${segment + 1}. segment (step ${step}):`);
        const promises = [];
        for (let segmentStep = 0; segmentStep < 10; segmentStep++) {
          promises.push(z.request({
            url: `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
            headers: {Authorization: `Token ${bundle.authData.api_token}`},
            skipThrowForStatus: true,
            skipHandleHTTPError: true,
          }));
        }
        const responses = await Promise.all(promises);
        delta = (new Date).valueOf() - start.valueOf();
        console.log(`${step} ${delta}: (${responses.length})`, responses.map((r) => r.status || null).join(", "));
        for (const response of responses) {
          if (response.status === 429) {
            if (response && response.data && response.data.detail) {
              // parse detail for number of seconds
              const detail = response.data.detail;
              const match = detail.match(/^Request was throttled\. Expected available in (\d+) seconds\.$/);
              const seconds = match && match[1];
              console.log(`${step} ${delta}: detail:`, detail);
              console.log(`${step} ${delta}: detail:`, seconds);

              return response;
            }
          }
          step++;
        }
      }
      return null;
    }, bundle);
    should.exist(results);
    should.exist(results.status);
    console.log(results.status.should);
    should.be(results.status, 429);
  }).timeout(20000);
});
