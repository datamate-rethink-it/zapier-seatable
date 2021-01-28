require('should')

const zapier = require('zapier-platform-core')

const App = require('../index')
const appTester = zapier.createAppTester(App)

describe('App - index', () => {

  it('handleHTTPError 403', async () => {
    const handleHTTPError = App.afterResponse[0]
    try {
      await appTester(handleHTTPError({status: 403}, undefined))
    } catch (e) {
      e.should.be.Object()
      e.should.isPrototypeOf('AppError')
      e.message.should.be.String()
      e.message.should.match(/^403 Forbidden: This Zap is not allowed to write data to SeaTable\. Most of the time this happens if you use an API-Token with read-only permission\.$/)
    }
  })

})
