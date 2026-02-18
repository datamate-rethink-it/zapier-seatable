const { inputFields } = require("./common");
const { getCollaborators, getUploadLink, uploadFile } = require("../utils");

const perform = async (z, bundle) => {
  const metadata_response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

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

  for (const column of targetTable.columns) {
    // Exactly three spaces => column value should be deleted
    // HINT: Does not work when using "zapier invoke": bundle.inputDataRaw is undefined
    if (bundle.inputDataRaw?.[column.name] === "   ") {
      row[column.name] = null;
      continue;
    }

    const value = bundle.inputData[column.name];
    if (value === undefined || value === "") {
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
        row[column.name] = [
          collaborators.find(
            (c) =>
              c.contact_email === value || c.email === value || c.name === value
          )?.email,
        ];
        break;
      case "file": {
        const uploadLink = await getUploadLink(z, bundle);
        const file = await uploadFile(z, uploadLink, value, "file");

        row[column.name] = [
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

        row[column.name] = [
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
        row[column.name] = value
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
            row_id: bundle.inputData.row_id,
          };
          link_records.push(link);
        }
        break;
      default:
        row[column.name] = value;
        break;
    }
  }

  const requestOptions = {
    method: "PUT",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/rows/`,
    body: {
      table_id: bundle.inputData.table_id,
      updates: [
        {
          row_id: bundle.inputData.row_id,
          row: row,
        },
      ],
    },
  };

  const response = await z.request(requestOptions);

  // create links, if necessary and swap table_ids if necessary
  if (link_records.length > 0) {
        
    for (const { table_id, other_table_id, link_id, row_id, other_row_id } of link_records) {
      const isSwapped = table_id !== targetTable._id;
      const [srcId, destId] = isSwapped ? [other_table_id, table_id] : [table_id, other_table_id];

      try {
        await z.request({
          method: "POST",
          url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/links/`,
          body: {
            table_id: srcId,
            other_table_id: destId,
            link_id,
            other_rows_ids_map: { [row_id]: [other_row_id] },
          },
        });
      } catch (error) {
        throw new Error(`Link creation failed. Please review the row ID "${other_row_id}".`);
      }
    }
  }

  return response.data;
};

module.exports = {
  key: "row_update",
  noun: "Row",
  display: {
    label: "Update Row",
    description:
      "Updates an existing row, probably with input from previous steps.",
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
      {
        key: "row_id",
        label: "Row",
        type: "string",
        required: true,
        helpText: "Enter the row ID of an existing row.",
        dynamic: "intern_rows.id.name",
        altersDynamicFields: false,
      },
      inputFields,
    ],
    sample: {
      success: true,
    },
    outputFields: [{ key: "success", label: "Success", type: "boolean" }],
  },
};
