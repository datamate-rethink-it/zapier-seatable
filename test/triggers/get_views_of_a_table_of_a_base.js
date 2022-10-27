require('should')

const zapier = require('zapier-platform-core')

const App = require('../../index')
const appTester = zapier.createAppTester(App)

describe('Trigger - get_views_of_a_table_of_a_base', () => {
  zapier.tools.env.inject()

  it('should get an array', async () => {
    const bundle = {
      authData: {
        server: process.env.SERVER,
        api_token: process.env.API_TOKEN,
      },
      inputData: {table_name: 'table:0000'},
    }

    const results = await appTester(
      App.triggers['get_views_of_a_table_of_a_base'].operation.perform,
      bundle,
    )
    results.should.be.an.Array()
    results.length.should.be.above(1)
    results[0].should.have.properties('id', 'Name')
    results[0].id.should.match(/^table:[^:]+:view:[^:]+$/)
  })
})
