const connectionLabel = (z, bundle) => {
  // remove https:// in front (but keep the non-secure to show)
  const address = bundle.authData.server.replace(/^https:\/\//, '').replace(/\/+$/, '')
  const {serverInfo, dtable} = bundle.inputData
  const editionAbbreviated = serverInfo.edition.replace('enterprise edition', 'EE')

  return `${address} (${serverInfo.version} ${editionAbbreviated}) ${dtable?.dtable_name} (${dtable?.app_name})`
}

module.exports = {
  type: 'custom',
  test: {
    require: 'src/authenticationFunctionRequire.js',
  },
  fields: [
    {
      computed: false,
      key: 'server',
      required: true,
      label: 'Server',
      type: 'string',
      default: 'https://cloud.seatable.io',
      helpText: 'The public SAAS Server is [https://cloud.seatable.io](https://cloud.seatable.io). Only if you use your own on-premise SeaTable you have to add something else.',
    },
    {
      computed: false,
      key: 'api_token',
      required: true,
      label: 'API-Token (of a Base)',
      type: 'string',
      helpText: 'Create an [API-Token](https://seatable.io/docs/handbuch/become-a-pro/api-tokens/?lang=auto) for one of your bases inside SeaTable.',
    },
  ],
  connectionLabel,
  customConfig: {},
}
