/* globals describe it */
'use strict';

const should = require('should');
const fs = require('fs/promises');
const {parse, HTMLElement} = require('node-html-parser');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

const ctx = require('../../src/ctx');

const {FixtureStore} = require('../fixture/store');

describe('Column Metadata Fixture', () => {
  zapier.tools.env.inject();
  // bundle.authData.server = bundle.authData.server.replace(/\/+$/, '');
  const bundle = {
    authData: {
      server: process.env.SERVER.replace(/\/+$/, ''),
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      table_view: 'table:0000:view:sx3j',
    },
  };

  const store = new FixtureStore();
  const htmlFile = FixtureStore.staticColumnNamesHtmlFile;

  it('should load fixture file', async () => {
    const fs = require('fs');
    const data = fs.readFileSync(htmlFile, 'utf8');
    should(data).be.String();
    should(data.length).be.greaterThan(400);
  });

  it('should parse fixture file', async () => {
    const fs = require('fs');
    const data = fs.readFileSync(htmlFile, 'utf8');
    const root = parse(data);
    const {childNodes: [container]} = root;

    should(root.parentNode).be.eql(null);
    should(container).be.instanceOf(HTMLElement);
    should(container.rawTagName).be.eql('div');
    should(container.innerText).be.String();
    should(container.innerText).startWith('BasicTextLong text');
  });

  it('should query fixture file', async () => {
    const data = await fs.readFile(htmlFile, 'utf8');
    const root = parse(data);
    const names = root.querySelectorAll('.select-column-item')
        .map((value) => value.attributes?.title);
    should(names).be.Array();
    should(names.length).be.eql(store.columnCount);
    names.map((value, index) => {
      should(value).be.String();
      should(value.length).be.greaterThan(2, `${value} at index ${index}`);
    });

    names.should.be.eql(store.columnNames);
  });

  it('should query table definition', async () => {
    await appTester(async (z, bundle) => {
      const name = FixtureStore.staticColumnsOnlyTableName;
      const {tables} = await ctx.acquireMetadata(z, bundle);
      const [{columns}] = tables.filter((table) => table.name === name);

      should(columns).be.Array();
      columns.length.should.be.eql(store.columnCount);

      const namesMap = new Map();

      const list = columns.map((value, index) => {
        should(value).be.instanceOf(Object, `at index #${index} :${JSON.stringify(value)}`);
        value.should.have.properties(['type', 'name']);
        const {type, name} = value;

        should(namesMap.get(name) === undefined).eql(true, `duplicate name ${name} at index ${index}`);
        namesMap.set(name, [type, index]);

        return {type, name};
      });

      list.length.should.eql(columns.length);
      namesMap.size.should.eql(columns.length);

      store.columnNames.map((name) => should(namesMap.get(name) !== undefined));
      const names = [...namesMap.keys()];
      store.columnNames.should.be.eql(names);

      await fs.writeFile(FixtureStore.staticColumnStoreJsonFile, `${JSON.stringify(list)}\n`);
    },
    bundle,
    );
  });
});
