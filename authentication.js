module.exports = {
  type: 'custom',
  test: {
    url: '{{bundle.authData.server}}/api/v2.1/dtable/app-access-token/',
    method: 'GET',
    params: {
      server: '{{bundle.authData.server}}',
      api_token: '{{bundle.authData.api_token}}',
    },
    headers: {
      Accept: 'application/json; charset=utf-8; indent=4',
      Authorization: 'Token {{bundle.authData.api_token}}',
      'X-SERVER': '{{bundle.authData.server}}',
      'X-API-TOKEN': '{{bundle.authData.api_token}}',
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
      helpText:
        'The public SAAS Server is [https://cloud.seatable.io](https://cloud.seatable.io). Only If use your own on-premise SeaTable you have to add something else.',
    },
    {
      computed: false,
      key: 'api_token',
      required: true,
      label: 'API-Token (of a Base)',
      type: 'string',
      helpText:
        'Create an [API-Token](https://seatable.io/docs/handbuch/become-a-pro/api-tokens/) for one of your bases inside SeaTable.',
    },
  ],
  connectionLabel: '({{bundle.authData.server}})',
  customConfig: {},
};
