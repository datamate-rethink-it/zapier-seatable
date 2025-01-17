const {
  collaboratorInfo,
  getPublicDownloadLink,
  getAssetPath,
} = require("../utils");
const hydrators = require("../hydrators");

const perform = async (z, bundle) => {
  const requestOptions = {
    method: "POST",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/sql/`,
    body: {
      sql:
        "SELECT _id, _ctime, _mtime, `" +
        bundle.inputData.asset_column +
        "` FROM `" +
        bundle.inputData.table_name +
        "` WHERE `" +
        bundle.inputData.asset_column +
        "` IS NOT NULL ORDER BY _mtime DESC",
      convert_keys: true,
    },
  };
  const response = await z.request(requestOptions);

  // get column type:
  const assetColumn = response.json.metadata.find(
    (column) => column.name === bundle.inputData.asset_column
  );

  // output
  const rows = [];
  let collaborators = false;
  let downloadLink = null;
  let assetLink = null;

  for (const row of response.json.results) {
    if (assetColumn.type === "file") {
      /**
       * multiple files possible
       * qDEk: [[Object],[Object]],
       */

      for (const obj of row[bundle.inputData.asset_column]) {
        // download and asset links
        if (bundle.inputData.download === "yes") {
          downloadLink = await getPublicDownloadLink(
            getAssetPath("files", obj["url"]),
            z,
            bundle
          );
          assetLink = z.dehydrateFile(hydrators.downloadFile, {
            url: downloadLink,
          });
        }

        const resultItem = {
          id: `${row._id}-${obj["url"]}-${obj["size"]}`,
          type: "file",
          name: obj["name"],
          size: obj["size"],
          url: obj["url"],
          publicUrl: downloadLink,
          asset: assetLink,
          metadata: {
            table_id: assetColumn.table_id,
            table_name: assetColumn.table_name,
            column_key: assetColumn.key,
            column_name: assetColumn.name,
            row_id: `${row._id}`,
            row_ctime: `${row._ctime}`,
            row_mtime: `${row._mtime}`,
          },
        };
        rows.push(resultItem);
      }
    } else if (assetColumn.type === "image") {
      /**
       * multiple images possible
       * fxHY: [
       * 'https://seatable.io/wp-content/uploads/2021/09/seatable-logo.png',
       * 'https://stage.seatable.io/workspace/224/asset/c392d08d-5b00-4456-9217-2afb89e07a0c/images/2023-06/hearthbeat.png'
       * ],
       **/

      for (const obj of row[bundle.inputData.asset_column]) {
        // download and asset links
        if (bundle.inputData.download === "yes") {
          downloadLink = await getPublicDownloadLink(
            getAssetPath("images", obj),
            z,
            bundle
          );
          assetLink = z.dehydrateFile(hydrators.downloadFile, {
            url: downloadLink,
          });
        }

        const resultItem = {
          id: `${row._id}-${obj}`,
          type: "image",
          name: "unknown", //TODO:...
          size: 0,
          url: obj,
          publicUrl: downloadLink,
          asset: assetLink,
          metadata: {
            table_id: assetColumn.table_id,
            table_name: assetColumn.table_name,
            column_key: assetColumn.key,
            column_name: assetColumn.name,
            row_id: `${row._id}`,
            row_ctime: `${row._ctime}`,
            row_mtime: `${row._mtime}`,
          },
        };
        rows.push(resultItem);
      }
    } else if (assetColumn.type === "digital-sign") {
      /**
       * always one object
       * JnY9: {
       *   sign_image_url: '/digital-signs/2023-06/a5adebe279e04415a28b2c7e256e9e8d%40auth.local-1686908335767.png',
       *   sign_time: '2023-06-16T09:38:55.807+00:00',
       *   username: 'a5adebe279e04415a11b2c7e256e9e8d@auth.local'
       * }
       */

      // get collaborators if needed
      if (!collaborators) {
        const response2 = await z.request({
          url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/related-users/`,
        });
        collaborators = response2.json.user_list;
      }

      const obj = row[bundle.inputData.asset_column];

      // download and asset links
      if (bundle.inputData.download === "yes") {
        downloadLink = await getPublicDownloadLink(
          getAssetPath("digital-signs", obj["sign_image_url"]),
          z,
          bundle
        );
        assetLink = z.dehydrateFile(hydrators.downloadFile, {
          url: downloadLink,
        });
      }

      const resultItem = {
        id: `${row._id}-${obj["sign_image_url"]}`,
        type: "signature",
        name:
          "Signature of " + collaboratorInfo(collaborators, obj.username).name,
        size: 0,
        url: obj["sign_image_url"],
        publicUrl: downloadLink,
        asset: assetLink,
        signed_by_email: collaboratorInfo(collaborators, obj.username)
          .contact_email,
        metadata: {
          table_id: assetColumn.table_id,
          table_name: assetColumn.table_name,
          column_key: assetColumn.key,
          column_name: assetColumn.name,
          row_id: `${row._id}`,
          row_ctime: `${row._ctime}`,
          row_mtime: `${row._mtime}`,
        },
      };
      rows.push(resultItem);
    }
  }

  return rows;
};

module.exports = {
  key: "new_asset",
  noun: "Asset",

  display: {
    label: "New File/Image/Signature",
    description:
      "Triggers when a new file, image or digital signature is added to a specific column.",
  },

  operation: {
    perform,

    inputFields: [
      {
        key: "table_name",
        label: "Table",
        type: "string",
        required: true,
        dynamic: "intern_tables.name",
        altersDynamicFields: true,
      },
      {
        key: "asset_column",
        label: "Asset Column",
        type: "string",
        required: true,
        dynamic: "intern_asset_columns.name",
        altersDynamicFields: true,
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
        helpText: "Choose whether to download the asset columns.",
      },
      {
        key: "alert",
        type: "copy",
        helpText:
          "To get a public download link for a file, image or digital-signature, will require additional API-calls.",
      },
    ],

    sample: {
      id: "images/2021-04/example-email-marketing.jpg",
      type: "image",
      name: "example-email-marketing.jpg",
      size: null,
      url: "https://cloud.seatable.io/workspace/4711/asset/891d4840-30cf-f4a4-9d6d-567244a1ae52/images/2021-04/example-email-marketing.jpg",
      publicUrl: "...",
      asset: "SAMPLE FILE (hydrated to)",
      metadata: {
        column_reference: "table:0000:row:EZc6JVoCR5GVMbhpWx_9FA:column:fyHY",
        column_key: "fyHY",
        column_name: "Image",
        row_id: "EZc6JVoCR5GVMbhpWx_9FA",
        row_reference: "table:0000:row:EZc6JVoCR5GVMbhpWx_9FA",
        row_ctime: "2023-06-21T20:20:31Z",
        row_mtime: "2023-06-21T20:25:52Z",
        table_id: "0000",
        table_name: "Time and Budget",
      },
    },

    outputFields: [
      { key: "type", label: "Type" },
      { key: "name", label: "Name of the file" },
      { key: "size", label: "Size in byte" },
      { key: "url", label: "File URL (requires auth.)" },
      { key: "publicUrl", label: "File URL (temp. available)" },
      { key: "asset", label: "File Asset" },
      { key: "metadata__column_key", label: "Meta: Column key" },
      { key: "metadata__column_name", label: "Meta: Column name" },
      { key: "metadata__row_id", label: "Meta: Row ID" },
      { key: "metadata__row_ctime", label: "Meta: Row creation time" },
      { key: "metadata__row_mtime", label: "Meta: Row last modification time" },
      { key: "metadata__table_id", label: "Meta: Table ID" },
      { key: "metadata__table_name", label: "Meta: Table name" },
    ],
  },
};
