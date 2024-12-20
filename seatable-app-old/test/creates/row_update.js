/* globals describe it */
const should = require("should");

const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe("Update row", () => {
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: "table:0000",
      table_view: "table:0000:view:2njg",
      table_row: "table:0000:row:drzVKsJpQ8K0KRR69w0gPA",
    },
  };

  it("should have dynamic table_view input field in creates.row_update", async () => {
    const results = await appTester(App.creates.row_update.operation.inputFields[1], bundle);
    should.exist(results);
  });

  it("should run creates.row_update update", async () => {
    bundle.inputDataRaw = {};
    bundle.inputData["column:0000"] = "Herr Nicht so gut"; // name: Name
    bundle.inputData["column:b9X2"] = "ok"; // name: OneOfSet
    bundle.inputData["column:L5UU"] = "9002"; // name: Number
    const results = await appTester(App.creates.row_update.operation.perform, bundle);
    should.exist(results);
    results.should.be.Object();
    results.should.not.be.Array();
  });

  it("should run creates.row_update exactly three spaces", async () => {
    bundle.inputDataRaw = {"column:0000": "   "}; // name: Name
    bundle.inputData["column:L5UU"] = "9002"; // name: Number
    const results = await appTester(App.creates.row_update.operation.perform, bundle);
    should.exist(results);
    results.should.be.Object();
    results.should.not.be.Array();
  });
});
