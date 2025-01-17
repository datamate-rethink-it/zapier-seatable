const { enrichColumns, processRowsForDownloadLinks } = require("../utils");

const perform = async (z, bundle) => {
  const requestOptions = {
    method: "GET",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    params: {
      table_id: bundle.inputData.table_id,
      view_id: bundle.inputData.view_id,
      limit: 1000,
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

  // get collaborators (if requested)...
  let collaborators = [];
  if (bundle.inputData.collaborators === "yes") {
    const response3 = await z.request({
      url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/related-users/`,
    });
    collaborators = response3.json.user_list;
  }

  // enrich rows (except download link)...
  let enrichedRows = (response.data.rows = response.data.rows.map((row) =>
    enrichColumns(row, metadata, collaborators, z, bundle)
  ));

  // DEBUG:
  //console.log(enrichedRows);

  // enrich rows with download links and file (if requested)
  enrichedRows = await processRowsForDownloadLinks(
    enrichedRows,
    z,
    bundle,
    bundle.inputData.download
  );

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
  noun: "Row",

  display: {
    label: "New Row",
    description: "Triggers when a new row is created.",
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
        helpText:
          "*Note:* This trigger returns only the first 1000 rows. If your table has more rows, please select a view and make sure that this view has either less than 1000 rows or that the newest entries are sorted to the top.",
      },
      {
        key: "view_id",
        label: "View",
        type: "string",
        required: false,
        dynamic: "intern_views.id.name",
        altersDynamicFields: true,
      },
      {
        key: "collaborators",
        label: "Provide collaborator names and e-mail adresses?",
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
        key: "download",
        label: "Provide access to images, files and digital signatures?",
        type: "string",
        choices: [
          { label: "Yes", sample: "yes", value: "yes" },
          { label: "No", sample: "no", value: "no" },
        ],
        default: "no",
        required: true,
        helpText:
          "Choose whether to download the asset columns. \
          **False**: You get only *internal links* to your files, images and signatures that require an authentication and therefore can not be used in your Zapier actions. Still you get access to the metadata of your files.\
          **True**: You get access to your files, images and signatures. SeaTable also creates public download links (valid for a few hours).",
      },
      {
        key: "alert",
        type: "copy",
        helpText:
          "Activating **Provide access to images, files and digital signatures** will require additional API-calls, so the [limits](https://api.seatable.io/reference/limits) may be exhausted earlier.",
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
