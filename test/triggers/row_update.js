/* globals describe it */
const should = require('should')

const zapier = require('zapier-platform-core')

const App = require('../../index')
const appTester = zapier.createAppTester(App)

describe('Update row', () => {
  zapier.tools.env.inject()
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
    inputData: {
      table_name: 'table:0000',
      table_view: 'table:0000:view:sx3j',
    },
  }

  it('triggers.row_update should have dynamic output fields', async () => {
    const results = await appTester(App.triggers.row_update.operation.outputFields[0], bundle)
    results.should.be.Array()
    results[0].should.eqls({key: 'row_id', label: 'Original ID'})
    results[1].should.eqls({key: 'row_mtime', label: 'Last Modified'})
    results[2].should.eqls({key: 'column:0000', label: 'Name'})
  })

  it('should run triggers.row_update', async () => {
    const results = await appTester(App.triggers.row_update.operation.perform, bundle)
    should.exist(results)
    results.should.be.Array()
    results.length.should.be.above(1)
    results[0].should.be.Object()
    results[0].should.have.properties('column:0000', 'row_id', 'row_mtime', 'id')
    results[0].id.should.eqls(`${results[0].row_id}-${results[0].row_mtime}`)
  })
})
