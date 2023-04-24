const {ZapBundle} = require('../ctx/ZapBundle');
const {sidParse} = require('../lib/sid');

const {stashFile} = require('../hydrators');

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
  const zb = new ZapBundle(z, bundle);
  const logTag = `[${zb}] triggers.${key}`;

  z.console.time(logTag);

  const fileSid = sidParse(bundle?.inputData?.file_column);

  const fileTable = fileSid.table;
  const fileColumnKey = fileSid.column;
  if (!fileTable || !fileColumnKey) {
    throw new z.errors.Error('Input: file_column invalid format error');
  }

  const fileHandler = await zb.fileHandler();
  const {table: tableMetadata, column: columnMetadata} =
      await fileHandler.findAssetColumn(String(fileSid)) || {};

  if (!columnMetadata) {
    throw new z.errors.Error(`Input: file_column not found: "${fileSid}"`);
  }

  const col = `\`${columnMetadata.name}\``;
  const table = `\`${tableMetadata.name}\``;
  const result = await zb.sqlQuery(
      `SELECT _id, _mtime, ${col} FROM ${table} WHERE ${col} IS NOT NULL ORDER BY _mtime DESC`,
  );

  const /** @type {AssetUrlInfo} */ urlInfo = await fileHandler.urlInfo;

  const process = async function* () {
    const urlMap = new Map();
    const urlCount = (url) => {
      let countUrl = urlMap.get(url) || urlMap.set(url, 0).get(url);
      urlMap.set(url, ++countUrl);
      return countUrl;
    };

    for (const [, row] of result.results.entries()) {
      const fieldRaw = row[fileColumnKey];
      fieldRaw.reverse();
      for (const [, file] of fieldRaw.entries()) {
        const url = typeof file === 'string' ? file : file.url;

        // each url only once
        if (urlCount(url) > 1) {
          continue;
        }

        // skip non asset URLs (e.g. external images)
        const id = urlInfo.urlGetAssetPath(url);
        if (id === null) {
          continue;
        }

        // prototype result-item
        const resultItem = {
          id,
          file: null, // hydrated to
          url: null, // hydrated from
          name: null,
          size: null,
          type: null,
          metadata: {
            colum_reference: `table:${tableMetadata._id}:row:${row._id}:column:${columnMetadata.key}`,
            colum_key: columnMetadata.key,
            colum_name: columnMetadata.name,
            colum_type: columnMetadata.type,
            row_id: `${row._id}`,
            row_reference: `table:${tableMetadata._id}:row:${row._id}`,
            row_ctime: `${row._ctime}`,
            row_mtime: `${row._mtime}`,
            table_id: tableMetadata._id,
            table_name: tableMetadata.name,
          },
        };

        // image
        if (typeof file === 'string') {
          resultItem.url = file;
          resultItem.name = urlInfo.urlGetBasename(resultItem.url);
          resultItem.size = null;
          resultItem.type = 'image';
          yield resultItem;
          continue;
        }

        // file
        resultItem.url = file.url;
        resultItem.name = file.name;
        resultItem.size = file.size;
        resultItem.type = file.type;

        yield resultItem;
      }
    }
  };

  // const rows = Array.from(process());
  const rows = [];
  for await (const val of process()) {
    rows.push(val);
  }

  if (0 === rows.length) {
    return rows;
  }

  const meta = bundle?.meta;
  if (meta && meta.isLoadingSample) {
    rows.splice(Math.min(meta.limit || 1, 1));
  }

  const assetDownloadLink = async (url) => {
    // 'https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg'
    const urlPath = /\/workspace\/\d+\/asset\/[0-9a-f-]+(\/.*)/.exec(url)?.[1];
    if (!urlPath) {
      throw new z.errors.Error(`Failed to extract path from url '${url}'`);
    }
    const link = (await zb.request(`/api/v2.1/dtable/app-download-link/?path=${urlPath}`))?.data?.download_link;
    if (!link) {
      throw new z.errors.Error(`Failed to obtain asset download link for path '${urlPath}' of url '${url}'`);
    }
    return link;
  };

  const promises = [];
  for (const row of rows) {
    promises.push(assetDownloadLink(row.url).then((url) => {
      row.file = z.dehydrateFile(stashFile, {
        downloadUrl: url,
      });
      delete row.url;
    }));
  }
  await Promise.all(promises);

  return rows;
};

const inputFileColumns = async (z, bundle) => {
  const zb = new ZapBundle(z, bundle);
  const fileHandler = await zb.fileHandler();

  const choices = [];
  // choices.push({label: 'All files across tables', sample: 'type:file', value: 'type:file'});
  // choices.push({label: 'All images across tables', sample: 'type:image', value: 'type:image'});

  const assetColumns = await fileHandler.listAssetColumns();
  for (const {column, table, sid} of assetColumns) {
    choices.push({
      label: `${table.name} / ${column.name} (${column.type})`,
      sample: 'table:0000:column:wNWn',
      value: sid,
    });
  }

  return {
    key: 'file_column',
    required: true,
    type: 'string',
    label: 'File Column',
    helpText: 'Field of the file.',
    altersDynamicFields: false,
    choices,
  };
};

const outputFields = async (z, bundle) => {
  return [
    {key: 'id', label: 'ID'},
    {key: 'file', type: 'file', label: 'File'},
    {key: 'name', type: 'string', label: 'Filename'},
    {key: 'size', label: 'Filesize'},
    {key: 'type', label: 'Filetype ("image" or "file")'},
  ];
};

module.exports = {
  key,
  noun: 'File',
  display: {
    label: 'New File/Image',
    description: 'Triggers when a new file/image is available in one specific column.',
    important: true,
  },
  operation: {
    perform,
    inputFields: [
      inputFileColumns,
    ],
    sample: {
      'id': 'images/2021-04/example-email-marketing.jpg',
      'path': 'images/2021-04/example-email-marketing.jpg',
      'url': 'https://cloud.seatable.io/workspace/4711/asset/891d4840-30cf-f4a4-9d6d-567244a1ae52/images/2021-04/example-email-marketing.jpg',
      'file': 'SAMPLE FILE',
      'name': 'example-email-marketing.jpg',
      'size': null,
      'type': 'image',
    },
    outputFields: [outputFields],
  },
};