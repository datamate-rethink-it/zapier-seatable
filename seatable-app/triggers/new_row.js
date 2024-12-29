const { enrichColumns } = require("../utils");

const perform = async (z, bundle) => {
  const requestOptions = {
    method: "GET",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    params: {
      table_id: bundle.inputData.table_id,
      view_id: bundle.inputData.view_id,
    },
  };
  const response = await z.request(requestOptions);

  // get metadata...
  const response2 = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });
  const metadata = response2.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  ).columns;

  // get collaborators...
  let collaborators = [];
  if (bundle.inputData.collaborators === "yes") {
    const response3 = await z.request({
      url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/related-users/`,
    });
    collaborators = response3.json.user_list;
  }

  // enrich columns...
  let enrichedRows = (response.data.rows = response.data.rows.map((row) =>
    enrichColumns(row, metadata, collaborators, z, bundle)
  ));

  // DEBUG:
  console.log(enrichedRows);

  // Add 'id' field to each item in the response
  const rowsWithId = enrichedRows.map((row) => ({
    ...row,
    id: row._id,
  }));

  return rowsWithId;
};

const addDynamicOutputFields = async (z, bundle) => {
  // API call to fetch dynamic fields
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const targetTable = response.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const dynamicColumnFields = targetTable.columns.map((column) => ({
    key: column.key,
    label: column.name,
  }));

  // Return the static fields along with the dynamic ones
  const generatedOutputFields = [
    { key: "_id", label: "Row ID", type: "string" },
    { key: "_mtime", label: "Last Modified Time" },
    { key: "_ctime", label: "Creation Time" },
    { key: "_creator", label: "Creator" },
    { key: "_last_modifier", label: "Last Modifier" },
    ...dynamicColumnFields,
  ];

  //console.log(generatedOutputFields);
  return generatedOutputFields;
};

module.exports = {
  key: "new_row",
  noun: "new_row",

  display: {
    label: "New Row ",
    description:
      "Triggers when a new row is created. (max xxx rows are possible in this view - otherwise the trigger will not work)",
  },

  operation: {
    perform,

    inputFields: [
      {
        key: "table_id",
        label: "Table",
        type: "string",
        required: true,
        dynamic: "intern_tables.id.name",
        altersDynamicFields: true,
      },
      {
        key: "view_id",
        label: "View",
        type: "string",
        required: true,
        dynamic: "intern_views.id.name",
        altersDynamicFields: true,
      },
      {
        key: "collaborators",
        label: "Include collaborator names?",
        type: "string",
        choices: [
          { label: "Yes", sample: "yes", value: "yes" },
          { label: "No", sample: "no", value: "no" },
        ],
        default: "no",
        required: true,
        helpText:
          "Choose whether to get the collaborator names and contact email adresses.",
      },
      {
        key: "alert",
        type: "copy",
        helpText:
          "To get a public download link for a file, image or digital-signature, use the action 'Get Public Download Link'.",
      },
    ],

    sample: {
      _ctime: "2024-12-29T15:33:30+01:00",
      _mtime: "2024-12-29T17:25:34+01:00",
      _id: "c1kYssFbSWWX5KT6yukooQ",
      id: "c1kYssFbSWWX5KT6yukooQ_2024-12-29T17:25:34+01:00",
    },

    outputFields: [addDynamicOutputFields],
  },
};
