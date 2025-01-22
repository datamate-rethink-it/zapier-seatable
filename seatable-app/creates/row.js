const { inputFields } = require("./common");
const { getCollaborators, getUploadLink, uploadFile } = require("../utils");

const perform = async (z, bundle) => {
  // TODO: handle single-select, multiple-select, collaborator, images, urls, ...

  // get metadata of the complete base
  const metadata_response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  // identify only the relevant/selected table (by id)
  const targetTable = metadata_response.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );

  if (!targetTable) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  // will be filled later, if there is a collaborator column
  let collaborators = [];

  const row = {};

  for (const [key, value] of Object.entries(bundle.inputData)) {
    // Skip table_id
    if (key === "table_id") {
      continue;
    }

    const column = targetTable.columns.find((column) => column.name === key);
    if (!column) {
      continue;
    }

    // Handle "special" column types
    switch (column.type) {
      case "collaborator":
        // get collaborators, if not yet done
        if (collaborators.length === 0) {
          collaborators = await getCollaborators(z, bundle);
        }

        console.log(collaborators);

        // Get the @auth.local email address from Name, @auth.local or the email address.
        row[key] = [
          collaborators.find(
            (c) =>
              c.contact_email === value || c.email === value || c.name === value
          )?.email,
        ];
        break;
      case "file": {
        const uploadLink = await getUploadLink(z, bundle);
        const file = await uploadFile(z, uploadLink, value, "file");

        row[key] = [
          {
            name: file.name,
            size: file.size,
            type: "file",
            url: `/workspace/${bundle.authData.workspaceId}${uploadLink.parent_path}/${uploadLink.file_relative_path}/${file.name}`,
          },
        ];

        break;
      }
      case "image": {
        const uploadLink = await getUploadLink(z, bundle);
        const image = await uploadFile(z, uploadLink, value, "image");

        row[key] = [
          `/workspace/${bundle.authData.workspaceId}${uploadLink.parent_path}/${uploadLink.img_relative_path}/${image.name}`,
        ];

        break;
      }
      case "multiple-select":
        /**
         * Must be an array. It accepts:
         * Mark Steven      => ["Mark", "Steven"]
         * Mark "Opt 2"     => ["Mark", "Option 2"]
         * "Opt 1" "Opt 2"  => ["Opt 1", "Opt 2"]
         **/
        row[key] = value
          .match(/("[^"]*"|\S+)/g)
          .map((item) => item.replace(/^"|"$/g, "").trim());
        break;
      default:
        row[key] = value;
        break;
    }
  }

  const requestOptions = {
    method: "POST",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    body: {
      table_id: bundle.inputData.table_id,
      rows: [row],
    },
  };
  console.log(requestOptions);
  const response = await z.request(requestOptions);
  return response.data;
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
  key: "row",
  noun: "Row",

  display: {
    label: "Create Row",
    description: "Creates a new row, probably with input from previous steps.",
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
        helpText: "Pick a SeaTable table to create the new Row in.",
      },
      inputFields,
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
