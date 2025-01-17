// find a particular intern_rows by name
const perform = async (z, bundle) => {
  const response = await z.request({
    url: "https://jsonplaceholder.typicode.com/posts",
    params: {
      name: bundle.inputData.name,
    },
  });
  // this should return an array of objects (but only the first will be used)
  return response.data;
};

module.exports = {
  key: "find_row",
  noun: "Find Row",

  display: {
    label: "Find Row",
    description:
      "Find a row using SQL Query search synctax. Optionally, create a row if none are found.",
  },

  operation: {
    perform,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. Searches need at least one `inputField`.
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
      // column (nur in manchen kann gesucht werden. Welchen?)
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
      // [ ] Create SeaTable row if it doesn't exist yet?
    ],

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obvious placeholder values that we can show to any user.
    sample: {
      id: 1,
      name: "Test",
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/main/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [
      // these are placeholders to match the example `perform` above
      // {key: 'id', label: 'Person ID'},
      // {key: 'name', label: 'Person Name'}
    ],
  },
};
