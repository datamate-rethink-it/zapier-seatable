require("should");

const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

const {ZapBundle: ZapBundle} = require("../../src/ctx/ZapBundle");
const {Metadata} = require("../../src/lib/metadata");

describe("ctx - ZapBundle", () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: "table:0000",
      file_column: "column:wNWg",
    },
  };

  it("should create", async () => {
    const result = await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
    result.should.be.Object();
    result.should.be.instanceOf(ZapBundle);
  });

  it("should obtain metadata of base", async () => {
    const zBundle = await appTester(async (z, bundle) => {
      return new ZapBundle(z, bundle);
    }, bundle);
    const result = await zBundle.metadata;
    result.should.be.Object();
    result.should.have.properties("tables", "version", "format_version", "settings");
    result.should.be.instanceOf(Object, "is plain object");
    result.should.be.instanceOf(Metadata, "is Metadata object");
  });
});
