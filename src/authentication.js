module.exports = {
  type: 'custom',
  test: {
    url: '{{bundle.authData.server}}/api/v2.1/dtable/app-access-token/',
    headers: {
      Authorization: 'Token {{bundle.authData.api_token}}',
    },
    removeMissingValuesFrom: {},
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
  connectionLabel: '({{bundle.authData.server}})',
  customConfig: {},
}
