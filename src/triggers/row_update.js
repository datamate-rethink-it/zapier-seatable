const ctx = require("../ctx");
const _ = require("lodash");

/**
 * perform
 *
 * triggers on a table row update (or create)
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
  // add bundle.dtable, bundle.dtable.tableMetadata and bundle.dtable.collaborators
  const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  collaborators = await ctx.acquireCollaborators(z, bundle);

  /*
  {
    authData: {
      server: 'https://stage.seatable.io',
      api_token: ':censored:40:eb45d77c08:'
    },
    inputData: {
      table_view: ...
      file_column: 'table:0000:column:qDEk',
      _zap_static_hook_code: '3hkyghe'
    },
    inputDataRaw: {...},
    meta: {
      isLoadingSample: true,
      isFillingDynamicDropdown: false,
      isTestingAuth: false,
      isPopulatingDedupe: false,
      limit: 3,
      page: 0,
      isBulkRead: false,
      zap: {
        ...
      }
    },
    serverInfo: {
      server: 'https://stage.seatable.io',
      version: '4.0.7',
      edition: 'enterprise edition'
    },
    dtable: {
      server_address: 'https://stage.seatable.io',
      app_name: 'zapier',
      access_token: '...',
      dtable_uuid: 'c392d08d-5b00-4456-9217-2afb89e07a0c',
      dtable_server: 'https://stage.seatable.io/dtable-server/',
      dtable_socket: 'https://stage.seatable.io/',
      dtable_db: 'https://stage.seatable.io/dtable-db/',
      workspace_id: 224,
      dtable_name: 'zapier - all columns',
      metadata: {
        tables: [
          {
            _id: "0000",
            name: "Table1",
            columns: [],
            views: []
          }
        ],
      },
      tableMetadata: {       <= selected table...
        _id: "0000",
        name: "Table1",
        columns: [],
        views: []
      }
      collaborators: [
        {
          email: "244b43hr6fy54bb4afa2c2cb7369d244@auth.local",
          name: "Ginger Ale",
          contact_email: "gingerale@example.com",
          avatar_url: "https://cloud.seatable.io/media/avatars/default.png",
          id_in_org: ""
        },
      ]
    }
  }
  */

  /**
   * get rows or the table (max 1.000 rows)
   * requestParamsBundle ist object mit table_id, view_id, je nach input...
   * @type {ZapierZRequestResponse}
   * */
  const response = await z.request({
    url: `${bundle.authData.server}/dtable-server/api/v1/dtables/${dtableCtx.dtable_uuid}/rows/`,
    headers: {Authorization: `Token ${dtableCtx.access_token}`},
    params: ctx.requestParamsBundle(bundle),
  });

  // result of api call...
  let rows = response.data.rows;
  if (0 === rows.length) {
    return rows;
  }

  // limit payload size
  // https://platform.zapier.com/docs/constraints#payload-size-triggers
  rows = _.orderBy(rows, ["_mtime"], ["desc"]);
  if (bundle.meta && bundle.meta.isLoadingSample) {
    rows.splice(bundle.meta.limit || 3);
  }

  // transform the results and enhance the return values
  rows = await Promise.all(_.map(rows, async (o) => {
    const transformedObj = await ctx.mapColumnKeysAndEnhanceOutput(z, bundle, tableMetadata.columns, o);
    transformedObj.id = `${transformedObj.row_id}-${transformedObj.row_mtime}`;
    return transformedObj;
  }));

  return rows;
};

/**
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array.<{label: string, key: string}>>}
 */
const outputFields = async (z, bundle) => {
  const tableMetadata = await ctx.acquireTableMetadata(z, bundle);
  const oF = [
    {key: "row_id", label: "Original ID"},
    {key: "row_mtime", label: "Last modification time"},
    {key: "row_ctime", label: "Creation time"},
    ...ctx.outputFieldsRows(tableMetadata.columns, bundle),
  ];
  return oF;
};

module.exports = {
  key: "row_update",
  noun: "Row Update",
  display: {
    label: "New or Updated Row",
    description: "Triggers everytime a new or updated row is found.",
  },
  operation: {
    perform,
    inputFields: [ctx.tableFields, ctx.fileNoAuthLinksField],
    sample: {
      "id": "N33qMZ-JQTuUlx_DiF__lQ",
      "row_id": "N33qMZ-JQTuUlx_DiF__lQ",
      "row_mtime": "2021-12-02T01:23:45.678+00:00",
      "column:0000": "Contents of the first field; a text-field",
    },
    outputFields: [outputFields],
  },
};
