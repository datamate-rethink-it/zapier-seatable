require("should");

const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

describe("Trigger - file_create", () => {
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

  it("should have inputFileColumns dynamic input field", async () => {
    const results = await appTester(App.triggers.file_create.operation.inputFields[0], bundle);
    results.should.be.Object();
    results.should.have.property("choices");
    const choices = results.choices;
    choices.should.be.Array();
    const [choice1] = choices;
    choice1.should.be.Object();
  });

  it("should have dynamic output fields", async () => {
    const results = await appTester(App.triggers.file_create.operation.outputFields[0], bundle);
    results.should.be.Array();
    results[0].should.eqls({key: "id", label: "ID"});
    results[1].should.eqls({key: "file", type: "file", label: "File"});
    results[2].should.eqls({key: "name", type: "string", label: "Filename"});
  });

  it("on image column should get an array", async () => {
    bundle.inputData = {
      file_column: "table:0000:column:wNWg",
    };
    const results = await appTester(App.triggers.file_create.operation.perform, bundle);
    results.should.be.an.Array();
    results.length.should.be.greaterThan(2);
    const record = results[1]; // first row (last array entry as reverse) contains non-empty children
    record.should.have.property("id");
    record.should.have.property("file");
    // additional properties to streamline with type: file
    record.should.have.property("name");
    record.should.have.property("size", null);
    record.should.have.property("type", "image");
  });

  it("on file column should get an array", async () => {
    bundle.inputData = {
      file_column: "table:0000:column:6Ev4",
    };
    const results = await appTester(App.triggers.file_create.operation.perform, bundle);
    results.should.be.an.Array();
    results.length.should.be.greaterThan(1);
    const record = results[0]; // first row (last array entry as reverse) contains non-empty children
    record.should.have.property("id");
    record.should.have.property("file");
    record.should.have.property("name");
    record.should.have.property("size");
    record.should.have.property("type", "file");
  });
});
