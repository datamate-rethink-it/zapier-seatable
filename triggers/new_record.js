const perform = (z, bundle) => {
  const getRecords = async (z, bundle) => {
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

    const getRows = await z.request(
      `${bundle.authData.server}/dtable-server/api/v1/dtables/${tokenres.dtable_uuid}/rows/`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${tokenres.access_token}`,
        },
        params: {
          table_name: bundle.inputData.table_name,
        },
      }
    );

    return getRows;
  };

  return getRecords(z, bundle).then((response) => {
    const datares = JSON.parse(response.content);

    var res = datares.rows;
    var i;

    for (i = 0; i < res.length; i++) {
      res[i].id = res[i]._id;
      delete res[i]._id;
    }

    var finres = JSON.stringify(res);
    return JSON.parse(finres);
  });
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'table_name',
        type: 'string',
        label: 'Table Name',
        dynamic: 'get_tables_of_a_base.Name.Name',
        helpText:
          'Shows all available tables from your SeaTable base. Please select one.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
    sample: { Name: 'John', id: 'N33qMZ-JQTuUlx_DiF__lQ' },
    outputFields: [{ key: 'Name' }, { key: 'id' }],
  },
  key: 'new_record',
  noun: 'record',
  display: {
    label: 'New Record',
    description: 'Triggers when a new record is available in a view.',
    hidden: false,
    important: true,
  },
};
