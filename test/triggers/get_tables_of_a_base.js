require('should')

const zapier = require('zapier-platform-core')

const App = require('../../index')
const appTester = zapier.createAppTester(App)

describe('Trigger - get_tables_of_a_base', () => {
  zapier.tools.env.inject()

  it('should get an array', async () => {
    const bundle = {
      authData: {
        server: process.env.SERVER,
        api_token: process.env.API_TOKEN,
      },
      inputData: {},
    }

    const results = await appTester(
      App.triggers['get_tables_of_a_base'].operation.perform,
      bundle,
    )
    results.should.be.an.Array()
  })
})
