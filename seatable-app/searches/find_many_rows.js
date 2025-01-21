const { enrichColumns, processRowsForDownloadLinks } = require("../utils");

// find a particular intern_rows by name
const perform = async (z, bundle) => {
  const metadata = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/metadata/`,
  });

  const table = metadata.json.metadata.tables.find(
    (table) => table._id === bundle.inputData.table_id
  );
  if (!table) {
    throw new Error(`Table with ID ${bundle.inputData.table_id} not found`);
  }

  const column = table.columns.find(
    (column) => column.key === bundle.inputData.column_key
  );
  if (!column) {
    throw new Error(`Column with key ${bundle.inputData.column_key} not found`);
  }

  let query = `SELECT * FROM \`${table.name}\` WHERE \`${column.name}\` `;
  let searchTerm = bundle.inputData.term;

  if (bundle.inputData.insensitive === "yes") {
    query = `SELECT * FROM \`${table.name}\` WHERE lower(\`${column.name}\`) `;
    searchTerm = searchTerm.toLowerCase();
  }

  if (bundle.inputData.wildcard === "yes") {
    query += `LIKE "%${searchTerm}%"`;
  } else {
    query += `= "${searchTerm}"`;
  }

  const response = await z.request({
    method: "POST",
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/sql/`,
    body: {
      sql: query,
      convert_keys: true,
    },
  });

  // get collaborators (if requested)...
  let collaborators = [];
  if (bundle.inputData.collaborators === "yes") {
    const response = await z.request({
      url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/related-users/`,
    });
    collaborators = response.json.user_list;
  }

  const rows = response.data.results.map((row) =>
    enrichColumns(row, table.columns, collaborators, z, bundle)
  );

  // This call mutates `rows`
  await processRowsForDownloadLinks(rows, z, bundle, bundle.inputData.download);

  // this should return something like this:
  // return [{Data: [{id:"adsfafd", name: "adfadf"},{id:"234", name: "234"}]}];
  return [{ Data: rows }];
};

module.exports = {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#searchschema
  key: "find_many_rows",
  noun: "rows",

  display: {
    label: "Find Many Rows (With Line Item Support)",
    description:
      "Finds a row using SQL Query search syntax. Optionally, create a row if none are found.",
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
        helpText: "Select the table you want to search in.",
      },
      {
        key: "column_key",
        label: "Search Column",
        type: "string",
        required: true,
        dynamic: "intern_search_columns.id.name",
        altersDynamicFields: false,
        helpText: "Select the column you want to search in.",
      },
      {
        key: "term",
        label: "Search term",
        required: true,
      },
      {
        key: "wildcard",
        label: "Activate wildcards",
        type: "string",
        choices: [
          { label: "Yes", sample: "yes", value: "yes" },
          { label: "No", sample: "no", value: "no" },
        ],
        default: "no",
        required: true,
        helpText:
          "**False:** The search only results perfect matches. **True:** Finds a row even if the search value is part of a string.",
      },
      {
        key: "insensitive",
        label: "Case Insensitive Search",
        type: "string",
        choices: [
          { label: "Yes", sample: "yes", value: "yes" },
          { label: "No", sample: "no", value: "no" },
        ],
        default: "no",
        required: true,
        helpText:
          "Whether the search ignores case sensitivity (**yes**). Otherwise, it distinguishes between uppercase and lowercase characters.",
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
    ],
    sample: {
      id: 1,
      name: "Test",
    },
    outputFields: [],
  },
};
