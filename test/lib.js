const should = require("should");

const {format} = require("../src/lib");

describe("Lib", () => {
  it("should format", async () => {
    should(format`foo ${0}`("bar")).equal("foo bar");
  });
});
