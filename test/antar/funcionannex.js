/* globals describe it */
"use strict";


const should = require("should");
const _ = require("lodash");


describe("Function Annex", () => {
  it("reviver algo", async () => {
    /**
     * @param {object} object
     * @param {function(key: string, value: any)} reviver
     * @return {object}
     */
    function revive(object, reviver) {
      /**
       * @param {*} holder
       * @param {string} key
       * @return {*}
       */
      function walk(holder, key) {
        const value = holder[key];
        if (value && typeof value === "object") {
          for (const k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
              const v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }
      return typeof reviver === "function" ?
          walk({"": object}, "") : object;
    }

    const subject = {delete: "me!", preserve: "me!"};

    const result = revive(subject, (key, value) => key === "delete" ? undefined : value);

    should(_.isEqual(result, {preserve: "me!"})).be.true();
  }).timeout(200);
});
