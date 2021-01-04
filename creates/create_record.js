const perform = (z, bundle) => {
  const addRecords = async (z, bundle) => {
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

    const getFieldsAPI = await z.request(
      `${bundle.authData.server}/dtable-server/api/v1/dtables/${tokenres.dtable_uuid}/metadata/`,
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

    const fieldres = getFieldsAPI.json;

    var res1 = fieldres.metadata.tables;
    var tid = 0;
    for (j = 0; j < res1.length; j++) {
      if (res1[j]['name'] == bundle.inputData.table_name) {
        tid = j;
      }
    }

    var res = fieldres.metadata.tables[tid].columns;
    var fdata = '{';
    var data = {};
    var i;
    var inputdatas = bundle.inputData;
    for (i = 0; i < res.length; i++) {
      key = res[i]['name'];
      if (i > 0) {
        fdata = fdata + ',"' + key + '":"' + inputdatas[key] + '"';
      } else {
        fdata = fdata + '"' + key + '":"' + inputdatas[key] + '"';
      }
    }
    fdata = fdata + '}';
    //{"Name": "I am new Row244"}

    const rowBody = {
      table_name: bundle.inputData.table_name,
      row: z.JSON.parse(fdata),
    };

    const addRow = await z.request(
      `${bundle.authData.server}/dtable-server/api/v1/dtables/${tokenres.dtable_uuid}/rows`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${tokenres.access_token}`,
        },
        body: rowBody,
      }
    );

    return addRow;
  };

  return addRecords(z, bundle).then((response) => {
    const datares = JSON.parse(response.content);

    return datares;
  });
};

const getInputFields = (z, bundle) => {
  // Configure a request to an endpoint of your api that
  // returns custom field meta data for the authenticated
  // user.  Don't forget to congigure authentication!

  const getFields = async (z, bundle) => {
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

    //const tokenResponse = await tokenGen.json();
    //console.log(tokenResponse);
    const tokenres = tokenGen.json;
    console.log(tokenres);

    const getFieldsAPI = await z.request(
      `${bundle.authData.server}/dtable-server/api/v1/dtables/${tokenres.dtable_uuid}/metadata/`,
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

    //const rowResponse = await getRows.json();
    //console.log(rowResponse);
    //console.log(getRows);

    return getFieldsAPI;
    //return tokenGen;
  };

  return getFields(z, bundle).then((response) => {
    const datares = JSON.parse(response.content);

    var res1 = datares.metadata.tables;
    var tid = 0;
    for (j = 0; j < res1.length; j++) {
      if (res1[j]['name'] == bundle.inputData.table_name) {
        tid = j;
      }
    }

    var res = datares.metadata.tables[tid].columns;
    var jsondata = [];
    var data = {};
    var i;

    for (i = 0; i < res.length; i++) {
      /*data = {
                        "id": res[i]['key'],
                        "Name": res[i]['Name']
                        };*/
      data = {
        type: res[i]['type'],
        key: res[i]['name'],
        required: false,
        label: res[i]['name'],
        help_text: 'Fields',
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
    inputFields: [
      {
        key: 'table_name',
        label: 'Table Name',
        type: 'string',
        helpText:
          'Shows all available tables from your SeaTable base. Please select one. The following input field will reloaded automatically.',
        dynamic: 'get_tables_of_a_base.Name.Name',
        required: true,
        list: false,
        altersDynamicFields: true,
      },
      getInputFields,
    ],
    sample: { '0000': 'I am new Row2445', _id: 'AdTy5Y8-TW6MVHPXTyOeTw' },
    outputFields: [{ key: '0000' }, { key: '_id' }],
  },
  key: 'create_record',
  noun: 'Record',
  display: {
    label: 'Create Record',
    description: 'Creates a new record with auto-populating fields',
    hidden: false,
    important: true,
  },
};
