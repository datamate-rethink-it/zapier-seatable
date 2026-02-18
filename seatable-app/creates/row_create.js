const { inputFields } = require("./common");
const { getCollaborators, getUploadLink, uploadFile } = require("../utils");

const perform = async (z, bundle) => {
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

  // variable to check, if I have to create a link after the row creation
  let link_records = [];

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
      case "link":
        if (value !== "") {          
          link = {
            other_row_id: value,
            table_id: column.data.table_id,
            other_table_id: column.data.other_table_id,
            link_id: column.data.link_id,
            row_id: "not available yet...",
          };
          link_records.push(link);
        }
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

  const response = await z.request(requestOptions);

  // show error, if there was one during creation.
  if (response.data?.inserted_row_count !== 1) {
    throw new Error("Row creation failed. Please review your input values.");
  }

  const new_row_id = response.data.first_row._id;

  // create links, if necessary and swap table_ids if necessary
  if (link_records.length > 0) {

    for (const { table_id, other_table_id, link_id, other_row_id } of link_records) {
      const isSwapped = table_id !== targetTable._id;
      const [srcId, destId] = isSwapped ? [other_table_id, table_id] : [table_id, other_table_id];

      await z.request({
        method: "POST",
        url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/links/`,
        body: {
          table_id: srcId,
          other_table_id: destId,
          link_id,
          other_rows_ids_map: { [new_row_id]: [other_row_id] },
        },
      });
    }
  }

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

  return generatedOutputFields;
};

module.exports = {
  key: "row_create",
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
      _ctime: "2024-12-29T15:33:30+0100",
      _mtime: "2024-12-29T17:25:34+0100",
      _id: "c1kYssFbSWWX5KT6yukooQ",
      id: "c1kYssFbSWWX5KT6yukooQ_2024-12-29T17:25:34+01:00",
    },

    outputFields: [addDynamicOutputFields],
  },
};
