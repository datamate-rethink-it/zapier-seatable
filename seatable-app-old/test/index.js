require("should");

const zapier = require("zapier-platform-core");

const App = require("../index");
const appTester = zapier.createAppTester(App);

const _CONST = require("../src/const");

describe("App - index", () => {
  const handleHTTPError = App.afterResponse[2];
  handleHTTPError.name.should.eql("handleHTTPError", "handleHTTPError function name check as index may move");

  it("handleHTTPError 403", async () => {
    try {
      await appTester(handleHTTPError({status: 403}, undefined));
    } catch (e) {
      e.should.be.Object();
      e.should.isPrototypeOf("AppError");
      e.message.should.be.String();
      const message = _CONST.STRINGS["http.error.status403"];
      e.message.should.match(message);
    }
  });

  it("handleHTTPError 429 to throw ThrottledError error", async () => {
    await appTester(async (z, bundle) => {
      try {
        await handleHTTPError({status: 429, request: {}, getHeader: (a) => a === "retry-after" ? 42 : null}, z);
      } catch (e) {
        e.should.be.Object();
        e.should.be.instanceOf(z.errors.ThrottledError);
        e.name.should.be.String();
        e.name.should.be.eql("ThrottledError");
        e.message.should.be.String();
        const exceptionMessageObj = JSON.parse(e.message);
        exceptionMessageObj.should.be.Object();
        exceptionMessageObj.message.should.be.String();
        const message = _CONST.STRINGS["http.error.status429"];
        exceptionMessageObj.message.should.match(message);
      }
    });
  });
});
