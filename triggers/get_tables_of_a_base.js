const perform = (z, bundle) => {
  const getTablesOfABase = async (z, bundle) => {
    const tokenGen = await z.request(
      `${bundle.authData.server}/api/v2.1/dtable/app-access-token/`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json; charset=utf-8; indent=4',
          Authorization: `Token ${bundle.authData.api_token}`,
          'X-API-TOKEN': bundle.authData.api_token,
          'X-SERVER': bundle.authData.server,
        },
        params: {
          api_token: bundle.authData.api_token,
          server: bundle.authData.server,
        },
      }
    );

    const tokenres = tokenGen.json;
    console.log(tokenres);

    const getTables = await z.request(
      `${bundle.authData.server}/dtable-server/api/v1/dtables/${tokenres.dtable_uuid}/metadata/`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json; charset=utf-8; indent=4',
          Authorization: `Token ${tokenres.access_token}`,
        },
        params: {},
      }
    );

    return getTables;
  };

  return getTablesOfABase(z, bundle).then((response) => {
    const datares = JSON.parse(response.content);

    var res = datares.metadata.tables;
    var jsondata = [];
    var data = {};
    var i;

    for (i = 0; i < res.length; i++) {
      data = {
        id: res[i]['_id'],
        Name: res[i]['name'],
      };
      jsondata.push(data);
    }

    var finres = JSON.stringify(jsondata);
    return JSON.parse(finres);
  });
};

module.exports = {
  operation: {
    perform: perform,
    sample: { id: '0000', Name: 'Table1' },
    outputFields: [{ key: 'id' }, { key: 'Name' }],
  },
  key: 'get_tables_of_a_base',
  noun: 'Table',
  display: {
    label: 'Hidden: Get tables of a base',
    description: 'Internal function to get the tables of a base.',
    hidden: true,
    important: false,
  },
};
