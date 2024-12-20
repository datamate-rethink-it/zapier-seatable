const { ZapBundle } = require('../ctx/ZapBundle');
const { sidParse } = require('../lib/sid');
const ctx = require('../ctx');

// const {stashFile} = require("../hydrators");

const key = 'file_create';

/**
 * perform
 *
 * triggers on a new file in table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
  // add dtable to bundle (not needed...)
  // const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);

  // get table and column from input
  const zb = new ZapBundle(z, bundle);
  const fileSid = sidParse(bundle?.inputData?.file_column);

  // z.console.log("fileSid", fileSid);   // z.B. { table: '0000', column: 'fxHY' }
  // z.console.log("fileColumnInput", bundle?.inputData?.file_column);  // z.B. table:0000:column:fxHY

  const fileTable = fileSid.table;
  const fileColumnKey = fileSid.column;
  if (!fileTable || !fileColumnKey) {
    throw new z.errors.Error('Input: file_column invalid format error');
  }

  // get real names for table and column from input
  const fileHandler = await zb.fileHandler();
  const { table: tableMetadata, column: columnMetadata } =
    (await fileHandler.findAssetColumn(String(fileSid))) || {};
  if (!columnMetadata) {
    throw new z.errors.Error(`Input: file_column not found: "${fileSid}"`);
  }

  // generate SQL-Query
  const col = `\`${columnMetadata.name}\``;
  const table = `\`${tableMetadata.name}\``;
  const result = await zb.sqlQuery(
    `SELECT _id, _ctime, _mtime, ${col} FROM ${table} WHERE ${col} IS NOT NULL ORDER BY _mtime DESC`
  );

  // z.console.log("columnMetadata", columnMetadata);
  // z.console.log("result.results", result.results);

  // get paths of the assets
  const rows = [];
  for (const row of result.results) {
    if ('image' === columnMetadata.type) {
      /**
       * multiple images possible
       * fxHY: [
       * 'https://seatable.io/wp-content/uploads/2021/09/seatable-logo.png',
       * 'https://stage.seatable.io/workspace/224/asset/c392d08d-5b00-4456-9217-2afb89e07a0c/images/2023-06/hearthbeat.png'
       * ],
       **/
      for (const obj of row[fileColumnKey]) {
        const pubFile = await ctx.getDownloadLinkFromPath(z, bundle, obj);
        const resultItem = {
          id: `${row._id}-${obj}`,
          type: 'image',
          name: ctx.getImageFilenameFromUrl(obj),
          size: 0,
          url: obj,
          publicUrl: pubFile.publicUrl,
          asset: pubFile.hydratedUrl,
          metadata: {
            column_reference: `table:${tableMetadata._id}:row:${row._id}:column:${columnMetadata.key}`,
            column_key: columnMetadata.key,
            column_name: columnMetadata.name,
            row_id: `${row._id}`,
            row_reference: `table:${tableMetadata._id}:row:${row._id}`,
            row_ctime: `${row._ctime}`,
            row_mtime: `${row._mtime}`,
            table_id: tableMetadata._id,
            table_name: tableMetadata.name,
          },
        };
        // z.console.log("DEBUG returnItem image", resultItem);
        rows.push(resultItem);
      }
    } else if ('file' === columnMetadata.type) {
      /**
       * multiple files possible
       * qDEk: [[Object],[Object]],
       */
      for (const obj of row[fileColumnKey]) {
        const pubFile = await ctx.getDownloadLinkFromPath(
          z,
          bundle,
          obj['url']
        );
        const resultItem = {
          id: `${row._id}-${obj['url']}`,
          type: 'file',
          name: obj['name'],
          size: obj['size'],
          url: obj['url'],
          publicUrl: pubFile.publicUrl,
          asset: pubFile.hydratedUrl,
          metadata: {
            column_reference: `table:${tableMetadata._id}:row:${row._id}:column:${columnMetadata.key}`,
            column_key: columnMetadata.key,
            column_name: columnMetadata.name,
            row_id: `${row._id}`,
            row_reference: `table:${tableMetadata._id}:row:${row._id}`,
            row_ctime: `${row._ctime}`,
            row_mtime: `${row._mtime}`,
            table_id: tableMetadata._id,
            table_name: tableMetadata.name,
          },
        };
        // z.console.log("DEBUG returnItem file", resultItem);
        rows.push(resultItem);
      }
    } else if ('digital-sign' === columnMetadata.type) {
      /**
       * always one object
       * JnY9: {
       *   sign_image_url: '/digital-signs/2023-06/a5adebe279e04415a28b2c7e256e9e8d%40auth.local-1686908335767.png',
       *   sign_time: '2023-06-16T09:38:55.807+00:00',
       *   username: 'a5adebe279e04415a11b2c7e256e9e8d@auth.local'
       * }
       */
      const pubFile = await ctx.getDownloadLinkFromPath(
        z,
        bundle,
        row[fileColumnKey].sign_image_url
      );
      const collaboratorInfo = await ctx.getCollaboratorData(z, bundle, [
        row[fileColumnKey].username,
      ]);
      z.console.log('DEBUG collaboratorInfo', collaboratorInfo);
      const resultItem = {
        id: `${row._id}-${row[fileColumnKey].sign_image_url}`,
        type: 'signature',
        name: `Signature of ${collaboratorInfo[0].name}`,
        size: 0,
        url: row[fileColumnKey].sign_image_url,
        publicUrl: pubFile.publicUrl,
        asset: pubFile.hydratedUrl,
        signed_by_email: collaboratorInfo[0].email,
        metadata: {
          column_reference: `table:${tableMetadata._id}:row:${row._id}:column:${columnMetadata.key}`,
          column_key: columnMetadata.key,
          column_name: columnMetadata.name,
          row_id: `${row._id}`,
          row_reference: `table:${tableMetadata._id}:row:${row._id}`,
          row_ctime: `${row._ctime}`,
          row_mtime: `${row._mtime}`,
          table_id: tableMetadata._id,
          table_name: tableMetadata.name,
        },
      };
      // z.console.log("DEBUG returnItem image", resultItem);
      rows.push(resultItem);
    } else {
      continue;
    }
  }

  // limit payload size
  // https://platform.zapier.com/docs/constraints#payload-size-triggers
  const meta = bundle?.meta;
  if (meta && meta.isLoadingSample) {
    rows.splice(meta.limit || 3);
  }

  // z.console.log("output", rows);
  return rows;
};

const inputFileColumns = async (z, bundle) => {
  const zb = new ZapBundle(z, bundle);
  const fileHandler = await zb.fileHandler();

  const choices = [];
  // choices.push({label: 'All files across tables', sample: 'type:file', value: 'type:file'});
  // choices.push({label: 'All images across tables', sample: 'type:image', value: 'type:image'});

  const assetColumns = await fileHandler.listAssetColumns();
  for (const { column, table, sid } of assetColumns) {
    choices.push({
      label: `${table.name} | ${column.name} (${column.type})`,
      sample: 'table:0000:column:wNWn',
      value: sid,
    });
  }

  return {
    key: 'file_column',
    required: true,
    type: 'string',
    label: 'File/Image/Signature Column',
    helpText:
      'Every new file/image/digital signature added to this column triggers the zap. When multiple elements are added, the are handled one by one.',
    altersDynamicFields: false,
    choices,
  };
};

module.exports = {
  key,
  noun: 'File',
  display: {
    label: 'New File/Image/Signature',
    description:
      'Triggers when a new file, image or digital signature is added to a specific column.',
  },
  operation: {
    perform,
    inputFields: [inputFileColumns],
    sample: {
      id: 'images/2021-04/example-email-marketing.jpg',
      type: 'image',
      name: 'example-email-marketing.jpg',
      size: null,
      url: 'https://cloud.seatable.io/workspace/4711/asset/891d4840-30cf-f4a4-9d6d-567244a1ae52/images/2021-04/example-email-marketing.jpg',
      publicUrl: '...',
      asset: 'SAMPLE FILE (hydrated to)',
      metadata: {
        column_reference: 'table:0000:row:EZc6JVoCR5GVMbhpWx_9FA:column:fyHY',
        column_key: 'fyHY',
        column_name: 'Image',
        row_id: 'EZc6JVoCR5GVMbhpWx_9FA',
        row_reference: 'table:0000:row:EZc6JVoCR5GVMbhpWx_9FA',
        row_ctime: '2023-06-21T20:20:31Z',
        row_mtime: '2023-06-21T20:25:52Z',
        table_id: '0000',
        table_name: 'Time and Budget',
      },
    },
    outputFields: [
      { key: 'type', label: 'Type' },
      { key: 'name', label: 'Name of the file' },
      { key: 'size', label: 'Size in byte' },
      { key: 'url', label: 'File URL (requires auth.)' },
      { key: 'publicUrl', label: 'File URL (temp. available)' },
      { key: 'asset', label: 'File Asset' },
      { key: 'metadata__column_reference', label: 'Meta: Column reference' },
      { key: 'metadata__column_key', label: 'Meta: Column key' },
      { key: 'metadata__column_name', label: 'Meta: Column name' },
      { key: 'metadata__row_id', label: 'Meta: Row ID' },
      { key: 'metadata__row_reference', label: 'Meta: Row reference' },
      { key: 'metadata__row_ctime', label: 'Meta: Row creation time' },
      { key: 'metadata__row_mtime', label: 'Meta: Row last modification time' },
      { key: 'metadata__table_id', label: 'Meta: Table ID' },
      { key: 'metadata__table_name', label: 'Meta: Table name' },
    ],
    // outputFields: [],
  },
};
