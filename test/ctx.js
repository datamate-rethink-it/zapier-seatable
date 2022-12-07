require('should');

const ctx = require('../src/ctx');
const _ = require('lodash');

describe('Ctx - sidParse', () => {
  it('should not parse as before but throw', async () => {
    try {
      ctx.sidParse('Table1');
    } catch (e) {
      e.should.be.Object();
      e.should.isPrototypeOf('AppError');
      e.message.should.be.String();
      e.message.should.match(/^unable to parse \(invalid\) sid: "Table1"$/);
    }
  });

  it('should parse table view', async () => {
    const result = {...ctx.sidParse('table:0000:view:0000')};
    result.should.not.be.Array();
    result.should.be.an.Object();
    result.should.not.have.property('v1');
    result.should.not.have.property('column');
    result.should.have.properties('table', 'view');
  });

  it('should parse table row', async () => {
    const result = {...ctx.sidParse('table:0000:row:drzVKsJpQ8K0KRR69w0gPA')};
    result.should.not.be.Array();
    result.should.be.an.Object();
    result.should.have.properties('table', 'row');
  });

  it('should handle view params', () => {
    const result = {...ctx.requestParamsSid('table:0000:view:sx3j')};
    result.should.have.properties('table_id', 'view_id');
  });
});

describe('Ctx - mapColumnKeys', () => {
  it('should map', async () => {
    const columns = require('./fixture/metadata').metadata.tables[0].columns;
    const row = {_id: 'xyz', Name: 'test', LinkSelf: []};
    const result = ctx.mapColumnKeys(_.filter(columns, (c) => c.type !== 'link'), row);
    result.should.be.an.Object();
    result.should.have.property('row_id'); // implicit mapping
    result.should.have.property('column:0000'); // convert named property to column:<key>
    result.should.not.have.property('column:486c'); // _.filter-ed out
  });
});
