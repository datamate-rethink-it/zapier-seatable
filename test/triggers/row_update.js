/* globals describe it */
const should = require('should')

const zapier = require('zapier-platform-core')

const App = require('../../index')
const appTester = zapier.createAppTester(App)

const _CONST = require('../../src/const')

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
    bundle._testFeature || (bundle._testFeature = [])
    bundle._testFeature[_CONST.FEATURE_MTIME_FILTER] = {captureRowsBeforeFilter: true}

    const results = await appTester(App.triggers.row_update.operation.perform, bundle)
    const resultsUnfiltered = bundle._testFeature[_CONST.FEATURE_MTIME_FILTER].capturedRows || null

    if (!_CONST.FEATURE[_CONST.FEATURE_MTIME_FILTER].enabled) {
      should.exist(results)
      should.not.exist(resultsUnfiltered)
      // skip further assertions if feature is not enabled.
      return
    }

    should.exist(resultsUnfiltered)
    resultsUnfiltered.should.be.Array()

    resultsUnfiltered.length.should.be.above(1)
    resultsUnfiltered[0].should.be.Object()
    resultsUnfiltered[0].should.have.properties('column:0000', 'row_id', 'row_mtime', 'id')
    resultsUnfiltered[0].id.should.eqls(`${resultsUnfiltered[0].row_id}-${resultsUnfiltered[0].row_mtime}`)

    should.exist(results)
    results.should.be.Array()
  })
})
