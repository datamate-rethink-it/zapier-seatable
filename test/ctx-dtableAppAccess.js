require('should')

const zapier = require('zapier-platform-core')

const App = require('../index')
const appTester = zapier.createAppTester(App)

const _CONST = require('../src/const')
const ctx = require('../src/ctx')

describe('dtableAppAccess', () => {
  zapier.tools.env.inject()
  const bundle = {
    authData: {
      server: process.env.SERVER,
      api_token: process.env.API_TOKEN,
    },
  }

  it('should not crumble on standard URL server-address', async () => {
    delete bundle.serverInfo
    delete bundle.dtable
    const fineServer = bundle.authData.server.replace(/\/+$/, '')
    bundle.authData.server = `${fineServer}/`
    const result = await appTester(async (z, bundle) => {
      return await ctx.acquireDtableAppAccess(z, bundle)
    }, bundle)
    result.should.be.Object()
    result.should.have.properties('server_address')
    result.server_address.should.be.String()
    result.server_address.should.equals(fineServer)
    bundle.should.have.properties('authData')
    bundle.authData.should.be.Object()
    bundle.authData.should.have.properties('server')
    bundle.authData.server.should.eql(result.server_address)
  })

  it('should claim app access', async () => {
    delete bundle.serverInfo
    delete bundle.dtable
    const result = await appTester(async (z, bundle) => {
      const result = await ctx.acquireDtableAppAccess(z, bundle)
      result.should.be.Object()
      result.should.have.properties('dtable_uuid')
      result.dtable_uuid.should.be.String()
      bundle.should.have.properties('dtable')
      bundle.dtable.should.be.Object()
      bundle.dtable.should.have.properties('dtable_uuid')
      bundle.dtable.dtable_uuid.should.eql(result.dtable_uuid)
    }, bundle)
  })

  it('should error app access', async () => {
    delete bundle.serverInfo
    delete bundle.dtable
    bundle.authData.api_token = '32cfdadda635d12a68ed950ff0d5055757a90fc0' // deleted-dtable r+w (tkl main cloud account)
    const result = await appTester(async (z, bundle) => {
      let result
      try {
        await ctx.acquireDtableAppAccess(z, bundle)
      } catch (e) {
        result = e
      }
      return result
    }, bundle)
    result.should.be.Object()
    result.should.have.properties('name', 'stack', 'message')
    result.name.should.be.equal('ExpiredAuthError', 'expected ExpiredAuthErrors was thrown')
    result.message.should.match(/^(SeaTable base has been deleted: |Your API Key is invalid\. Please reconnect your account\.)/, `expected ExpiredAuthErrors message, got ${JSON.stringify(result.message)}`)
  })
})
