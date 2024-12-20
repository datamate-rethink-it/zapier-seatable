/* globals describe it */
"use strict";

const should = require("should");
const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

const ctx = require("../../src/ctx");


describe("error handling on 5000+ rows", () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      server: process.env.SERVER,
      base_app_name: "Big Copy 331894", /*  ~5720 rows */
      api_token: "f65a5d1a4b374016416c609c29bc9322ea51f78d",
    }, inputData: {
      table_name: "table:0000", table_view: "table:0000:view:sx3j",
    },
  };

  /**
   * timestamp: 2023-03-18T03:06:55.154Z
   * --------------------------------------------------------------------------------
   * REQUEST
   * --------------------------------------------------------------------------------
   * GET https://cloud.seatable.io/dtable-server/api/v1/dtables/736be4e2-83e9-454a-b337-226715008b3f/filtered-rows/?table_id=AuFW
   * { "filters": [{ "column_name": "ORDER ID", "filter_predicate": "contains", "filter_term": "113-0974941-9620209", "filter_term_modifier": "" }]}
   * --------------------------------------------------------------------------------
   * RESPONSE
   * --------------------------------------------------------------------------------
   * 413
   * { "error_msg": "the current API only supports the retrieval of Base with less than 5000 rows."}
   */

  it("it should trigger 413 for get filtered rows", async () => {
    await appTester(
        async (z, /** ZapierBundle */ bundle) => {
          const dtableCtx =
              await ctx.acquireDtableAppAccess(z, bundle);

          bundle.inputData.search_column = "column:0000";

          /** @type {ZapierZRequestResponse} */
          let response;
          let error;
          try {
            response = await z.request({
              url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/filtered-rows/`,
              headers: {Authorization: `Token ${bundle.dtable.access_token}`},
              params: ctx.requestParamsSid(bundle.inputData.table_name),
              allowGetBody: true,
              body: {"filters": [await ctx.filter(z, bundle, "test")]},
            });
          } catch (e) {
            error = e;
          }

          should(response === undefined).be.equal(true);
          should(error).be.instanceOf(Error);
          String(error).should.match(
              /The current API only supports the retrieval of Base with less than 5000 rows. \(413\)/,
          );

          // throws, just some antar debug code here
          // const rows = response.data.rows;
          // const a = 1;
        }, bundle);
  });
});

