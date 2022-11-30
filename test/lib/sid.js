const should = require('should');

const {sidParse, SidObj} = require('../../src/lib/sid');

describe('Lib sidParse / SidObj', () => {

  for (const [sid, expected, description] of [
    ['table:0000', {table: '0000'}, 'v1: table only'],
    ['table:0000:view:0000', {table: '0000', view: '0000'}, 'v1: table view'],
    ['table:0000:row:xXxX', {table: '0000', row: 'xXxX'}, 'v1: table row'],
    ['column:xXxX', {column: 'xXxX'}, 'v1: column only'],
    ['table:0000:column:xXxX', {table: '0000', column: 'xXxX'}, 'v2: table column'],
  ]) {
    it(`should sidParse ${sid} -- ${description}`, async () => {
      should(sidParse(sid)).be.instanceOf(Object).properties(expected);
    });
  }

  it('should non-string fall-through sidParse(undefined) to empty object', async () => {
    should(sidParse(undefined)).be.instanceOf(Object).properties({});
  });

  it('should non-string fall-through fallback sidParse(undefined) to undefined', async () => {
    should(sidParse(undefined, undefined)).be.undefined();
  });

  it('should throw sidParse("upload_only")', async () => {
    let error;
    try {
      sidParse('upload_only');
    } catch (e) {
      error = e;
    }
    should(error).be.instanceOf(Error);
    should(String(error)).equal('Error: unable to parse (invalid) sid: "upload_only"');
  });

  it('should fall-back sidParse("upload_only") to undefined', async () => {
    should(sidParse('upload_only', undefined)).be.undefined();
  });

  it('should be SidObj', async () => {
    const sid = 'table:0000:view:0000';
    const obj = sidParse(sid);
    should(obj).instanceOf(Object, 'must be object');
    should(obj).instanceOf(SidObj);
  });

  it('should SidObj.toString() back to sid', async () => {
    const sid = 'table:0000:view:0000';
    const obj = sidParse(sid);
    should(`${obj}`).equal(sid);
  });
});
