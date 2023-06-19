require("should");

const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

const ctx = require("../../src/ctx");

describe("Trigger - row_create", () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: "table:0000",
      table_view: "table:0000:view:sx3j",
      [ctx.FEATURE_NO_AUTH_ASSET_LINKS]: true,
    },
  };

  it("triggers.row_create should have dynamic output fields", async () => {
    const results = await appTester(App.triggers.row_create.operation.outputFields[0], bundle);
    results.should.be.Array();
    results[0].should.eqls({key: "row_id", label: "Original ID"});
    results[1].should.eqls({key: "row_mtime", label: "Last Modified"});
    results[2].should.eqls({key: "column:0000", label: "Name"});
    results[results.length - 2].should.eqls({
      "key": "column:wNWg-(no-auth-dl)",
      "label": "Picture (Download w/o Authorization)",
    });
    results[results.length - 1].should.eqls({
      "key": "column:6Ev4-(no-auth-dl)",
      "label": "File (Download w/o Authorization)",
    });
  });

  it("triggers.row_create should support links in dynamic output fields", async () => {
    bundle.inputData = {
      table_name: "table:ADSg",
      table_view: "table:ADSg:view:0000",
    };
    // test against fixture
    bundle.dtable = require("../fixture/dtable");
    bundle.dtable.metadata = require("../fixture/metadata").metadata;
    const results = await appTester(App.triggers.row_create.operation.outputFields[0], bundle);
    results.should.be.Array();
    results.length.should.be.equal(6); // 4 columns + 2 row keys: _id & _mtime
    const link = results[5];
    link.should.have.property("children");
    const children = link.children;
    children.length.should.be.equal(5); //  4 columns + 2 row keys - 1 link column
  });

  it("triggers.row_create should get an array", async () => {
    // test against dtable server
    delete bundle.serverInfo;
    delete bundle.__zTS;
    delete bundle.dtable;
    const results = await appTester(App.triggers.row_create.operation.perform, bundle);
    results.should.be.an.Array();
    results.should.matchEach((o) => o.should.have.properties("row_id", "row_mtime", "column:0000"));
    let counter = 0;
    results.forEach((o) => (null === o["column:0000"]) && counter++);
    (counter < results.length / 10).should.be.ok();
  });

  it("triggers.row_create should get an array with children", async () => {
    bundle.inputData = {
      table_name: "table:ADSg",
      table_view: "table:ADSg:view:0000",
    };
    const results = await appTester(App.triggers.row_create.operation.perform, bundle);
    results.should.be.an.Array();
    results.length.should.be.equal(2);
    const record = results[1]; // first row (last array entry as reverse) contains non-empty children
    record.should.have.property("column:99m0");
    const children = record["column:99m0"];
    children.should.be.an.Array();
    children.length.should.be.equal(1);
    const child = children[0];
    child.should.be.an.Object();
  });

  it("triggers.row_create should acquire image links", async () => {
    bundle.inputData = {
      table_name: "table:0000",
      table_view: "table:0000:view:sx3j",
      [ctx.FEATURE_NO_AUTH_ASSET_LINKS]: true,
    };
    const results = await appTester(App.triggers.row_create.operation.perform, bundle);
    results.should.be.an.Array();
    results.length.should.be.equal(4);
    results[0].should.have.properties("column:wNWg-(no-auth-dl)", "column:6Ev4-(no-auth-dl)");
    results[0]["column:wNWg-(no-auth-dl)"][0].should.be.a.String();
    results[0]["column:6Ev4-(no-auth-dl)"][0].url.should.be.a.String();
    results[0]["column:wNWg-(no-auth-dl)"][0].should.endWith("/example-email-marketing.jpg");
    results[0]["column:6Ev4-(no-auth-dl)"][0].url.should.endWith("/magazine2.jpg");
  });
});
