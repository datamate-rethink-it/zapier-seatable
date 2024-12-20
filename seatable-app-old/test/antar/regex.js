/* globals describe it */
"use strict";


const should = require("should");


describe("Regular Expressions", () => {
  it("should remove trailing characters", async () => {
    const subject = "https://cloud.seatable.io/";

    const result= subject.replace(/\/+$/, "");
    should(result).be.equal("https://cloud.seatable.io");
  }).timeout(200);
});
