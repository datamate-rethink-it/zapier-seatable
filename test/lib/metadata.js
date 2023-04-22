
require('should');

const should = require('should');
const {metadata: requiredMetadata} = require('../fixture/metadata-3.2');
const {Metadata, MetadataNode, MetadataTables, MetadataTable, MetadataTableColumns, MetadataTableColumn,
  MetadataTableView,
  MetadataTableViews,
} = require('../../src/lib/metadata');
const ctx = require('../../src/ctx');

const metadata = new Metadata(requiredMetadata);

describe('lib - metadata', () => {
  it('should create Metadata', async () => {
    metadata.should.be.Object();
    metadata.should.be.instanceOf(Metadata);
    metadata.should.be.instanceOf(MetadataNode);
    metadata.should.have.properties('format_version', 'settings', 'tables', 'version');
  });

  it('should have tables', async () => {
    const {tables} = metadata;
    tables.should.be.instanceOf(Array);
    tables.should.be.instanceOf(MetadataTables);
    tables.length.should.be.greaterThan(0);
    tables[0].should.be.instanceOf(MetadataTable);
    should(tables[0] === tables.select(tables[0]._id)).be.true();
    should(tables.select('foo')).be.undefined();
  });

  it('should have a table with views', async () => {
    const {views} = metadata.tables[0];
    views.should.be.instanceOf(Array);
    views.should.be.instanceOf(MetadataTableViews);
    views.length.should.be.greaterThan(0);
    views[0].should.be.instanceOf(MetadataTableView);
    should(views[0] === views.select(views[0]._id)).be.true();
    should(views.select('foo')).be.undefined();
    should(views.parent).equal(metadata.tables[0]);
    should(views.parent).equal(views[0].parent);
    should(views[0].parent.parent).equal(metadata);
  });

  it('should have a table with columns', async () => {
    const {columns} = metadata.tables[0];
    columns.should.be.instanceOf(Array);
    columns.should.be.instanceOf(MetadataTableColumns);
    columns.length.should.be.greaterThan(0);
    columns[0].should.be.instanceOf(MetadataTableColumn);
    should(columns[0] === columns.select(columns[0].key)).be.true();
    should(columns.select('foo')).be.undefined();
  });

  it('should have tableName', async () => {
    should(undefined === metadata.tableName('xxx')).be.ok();
    metadata.tableName('yMwZ').should.equal('Files', 'find by _id');
    metadata.tables.name('yMwZ').should.equal(metadata.tableName('yMwZ'));
    metadata.tableName('table:0000').should.equal('Table1', 'find by Sid');
    metadata.tableName('table:0000:column:fooKey').should.equal('Table1', 'find by Sid');
  });

  it('should find column by sid', async () => {
    should(undefined === metadata.findColumn('table:0000:column:fooKey')).be.ok();

    let column = metadata.findColumn('table:0000:column:0000');
    column.name.should.be.equal('Name');
    column.key.should.be.equal('0000', 'key is of column "Name"');

    // column check w/ non-default column key
    column = metadata.findColumn('table:0000:column:6Ev4');
    column.name.should.be.equal('File');
    column.key.should.be.equal('6Ev4', 'key is of column "File"');

    // column check w/ non-default table id
    column = metadata.findColumn('table:yMwZ:column:IUtu');
    column.name.should.be.equal('File');
    column.key.should.be.equal('IUtu', 'key is of column "File"');

    // check throwing behaviour on invalid table reference
    let caught;
    column = null;
    try {
      column = metadata.findColumn('IUtu', 'nonExisting');
    } catch (e) {
      caught = e;
    }
    should(caught).be.ok();

    // check working with table reference
    column = metadata.findColumn('W4Q5', 'yMwZ');
    column.should.be.Object();
    column.name.should.be.equal('Image');
  });

  it('should have undefined column name', () => {
    should(undefined === metadata.columnName('empty_or_missing_intentionally')).be.ok();
  });

  it('should get tables', () => {
    const test = (tables) => {
      tables.should.be.Array();
      tables.length.should.equal(8);
      tables.should.matchEach((v) => v.should.be.instanceOf(MetadataTable));
    };

    test(metadata.tables); // getter
  });

  it('should get columns', () => {
    const table = metadata.tables[2];
    const test = (columns) => {
      columns.should.be.Array();
      columns.length.should.equal(19);
      columns.should.matchEach((v) => v.should.be.instanceOf(MetadataTableColumn));
    };

    test(table.columns); // getter
  });

  it('should find columns by type across tables', () => {
    const result = metadata.findColumnsByType(...ctx.struct.columns.assets);
    result.should.be.instanceOf(Array);
    result.length.should.be.equal(5);
  });

  it('should find columns for row search', () => {
    const result = metadata.tables[0].columns.forRowLookup;
    should(result).not.be.undefined();
    result.should.be.instanceOf(Array);
    result.should.be.instanceOf(MetadataTableColumns);
    result.length.should.be.equal(2);
    result[0].should.be.instanceOf(MetadataTableColumn);
  });
});
