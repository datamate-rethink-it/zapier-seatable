/**
 * @fileoverview SeaTable Rest API Schema by usage in Zapier only,
 * not the full API schema.
 */

/**
 * @typedef {Object} ServerInfo
 * @property {string} version
 * @property {string} edition
 */

/**
 * @typedef {Object} SqlQueryResult
 * @property {boolean} success
 * @property {string} error_message
 * @property {SqlQueryResultRows} results
 * @property {Array<DTableColumn>} metadata
 */

/**
 * @typedef {Array<SqlQueryResultRow>} SqlQueryResultRows
 */

/**
 * @typedef {Object} SqlQueryResultRow
 * @property {string} _id of row, e.g. "O5VwAAXJQ0WAIZ7tqI2GTA"
 * @property {string} _mtime "2022-10-27T09:46:13.123Z"
 * @property {string} _ctime "2021-01-04T09:37:41.619Z"
 * @property {*} *  further result columns w/ member name either column key or name (depends on query type)
 *
 * e.g.
 *   "Picture": [
 *     "https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/images/2021-04/example-email-marketing.jpg",
 *     "https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/images/2022-10/Seafile.jpg"
 *   ]
 */

/**
 * @typedef {('file', 'image')} UploadAssetType
 */

/**
 * @typedef {Object} UploadLink
 * @property {string} upload_link "https://cloud.seatable.io/seafhttp/upload-api/9a0d189f-284b-4c3e-973a-3d30987a99fb"
 * @property {string} parent_path "/asset/98d18404-03fc-4f4a-9d6d-6527441aea25"
 * @property {string} img_relative_path "images/2022-11"
 * @property {string} file_relative_path "files/2022-11"
 */

/**
 * @typedef {Object} UploadResult
 * @property {string} name "slides.xml"
 * @property {string} id "ff6b682a8277cc1b2f78cf6b8d251952d5e18362"
 * @property {number} size" 522
 */

/**
 * @typedef {Object} DTable
 * @property {string} server_address {server_address} on access, non-standard
 * @property {string} app_name
 * @property {string} access_token
 * @property {string} dtable_uuid
 * @property {string} dtable_server
 * @property {string} dtable_socket
 * @property {number} workspace_id
 * @property {string} dtable_name
 * @property {DTableMetadataTables} metadata?
 */

/**
 * @typedef {DTableAssetFile|DTableAssetImage} DTableAssetAny
 */

/**
 * @typedef {Object} DTableAssetFile
 *
 *
 * @property {string} name "magazine2.jpg"
 * @property {number} size 49989
 * @property {'file'} type "file"
 * @property {DTableAssetUrl} url "https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg"
 */

/**
 * @typedef {DTableAssetUrl} DTableAssetImage
 */

/**
 * @typedef {string} DTableAssetUrl "https://cloud.seatable.io/workspace/4881/asset/98d18404-03fc-4f4a-9d6d-6527441aea25/files/2021-04/magazine2.jpg"
 */

/**
 * @typedef {Object} DTableMetadata
 * @property {DTableMetadataTables} metadata
 */

/**
 * @typedef {Object} DTableMetadataSettings
 * @property {Array<string>} extra_toolbar_items e.g. ["sql-query"] where "sql-query" is a plugin-name.
 */

/**
 * @typedef {Object} DTableMetadataTables
 * @property {Array<DTableTable>} tables
 * @property {number} version = 3634
 * @property {number} format_version = 9
 * @property {DTableMetadataSettings} settings
 */

/**
 * @typedef {Object} DTableTable
 * @property {string} _id
 * @property {string} name
 * @property {Array<DTableColumn>} columns
 * @property {Array<DTableView>} views
 */

/**
 * @typedef {Object} DTableTableColumn
 * @property {DTableTable} table
 * @property {DTableColumn} column
 */

/**
 * all supported column types in this schema
 *
 * @typedef {('auto-number'|'checkbox'|'collaborator'|'creator'|
 *            'ctime'|'date'|'duration'|'email'|'file'|
 *            'formula'|'geolocation'|'image'|'last-modifier'|
 *            'long-text'|'link'|'number'|
 *            'mtime'|'multi-select'|'single-select'|'text'|'url'
 *            )} DTableColumnType
 */

/**
 * @typedef {Object} DTableColumn
 * @property {string} key
 * @property {string} name
 * @property {DTableColumnType} type
 * @property {number} width (UI) in pixels
 * @property {boolean} editable (UI)
 * @property {boolean} resizeable (UI)
 */

/**
 * typedef {Object} DTableView
 */

/**
 * @typedef {DTableColumn} DTableColumnTLink
 * @property {'link'} type
 * @property {DTableColumnTLinkData} data
 */

/**
 * @typedef DTableColumnTLinkData
 * @property {string} display_column_key example: 0000
 * @property {string} table_id example: 0000
 * @property {string} other_table_id example: P8z8
 * @property {boolean} is_internal_link example: true
 * @property {string} link_id example: pTbM
 */

/**
 * @typedef {Object} DTableView
 * @property {string} _id
 * @property {string} name
 * @property {Array<string>} hidden_columns by their column keys
 */

/**
 * @typedef {Object} DTableRow
 */

/** ****************************************************************************
 * Zapier API Bindings
 *
 * binding lightly for prototyping
 */

/**
 * @typedef {Object} ZapierZRequestResponse
 * @property {Object} data
 */

/**
 * @typedef {ZapierZRequestResponse} DTableMetadataResponse
 * @property {DTableMetadata} data
 */

/**
 * @typedef {ZapierZRequestResponse} DTableCreateRowResponse
 * @property {DTableRow} data
 */

/**
 * {@see Bundle}
 *
 * @typedef {Object} ZapierBundle
 * @property {DTable} dtable
 */

/**
 * {@see HttpRequestOptions}
 *
 * @typedef {Object} SeaTableZapierRequestOptions
 * @property {string} endPointPath?
 * @property {boolean} skipHandleHTTPError?
 * @property {boolean} skipHandleUndefinedJson?
 */

// -----------------------------------------------------------------------------
// Zapier Schema
// -----------------------------------------------------------------------------

/**
 * @typedef {Function} ZObjectRequest
 *
 *   request: {
 *     // most specific overloads go first
 *     (
 *       url: string,
 *       options: HttpRequestOptions & { raw: true }
 *     ): Promise<RawHttpResponse>;
 *     (
 *       options: HttpRequestOptions & { raw: true; url: string }
 *     ): Promise<RawHttpResponse>;
 *
 *     (url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
 *     (options: HttpRequestOptions & { url: string }): Promise<HttpResponse>;
 *   };
 */

/**
 * @typedef {<T>(
 *   func: (z: ZObject, bundle: Bundle<T>) => any,
 *   inputData: T
 * ) => string} ZObjectDehydrateFunc
 */

/**
 * @typedef {Object} ZObjectCursor
 * @property {() => Promise<string>} get
 * @property {(cursor: string) => Promise<null>} set
 */

/**
 * @typedef {ZObjectStashFileA|ZObjectStashFileB|ZObjectStashFileC} ZObjectStashFile
 *
 *   /**
 *    * turns a file or request into a file into a publicly accessible url
 *    * (in ZObject)
 *   stashFile: {
 *     (
 *       input: string | Buffer | NodeJS.ReadableStream,
 *       knownLength?: number,
 *       filename?: string,
 *       contentType?: string
 *     ): string;
 *     (input: Promise<RawHttpResponse>): string;
 *     (input: Promise<string>): string;
 *   };
 *
 * @typedef {(
 *       input: string | Buffer | NodeJS.ReadableStream,
 *       knownLength?: number,
 *       filename?: string,
 *       contentType?: string
 *     ) => string} ZObjectStashFileA
 * @typedef {(input: Promise<RawHttpResponse>) => string} ZObjectStashFileB
 * @typedef {(input: Promise<string>) => string} ZObjectStashFileC
 */

/**
 * @typedef {Object} ZObject
 * @property {ZObjectRequest} request
 * @property {Console} console
 * @property {ZObjectDehydrateFunc} dehydrate
 * @property {ZObjectDehydrateFunc} dehydrateFile
 * @property {ZObjectCursor} cursor
 * @property {() => string} generateCallbackUrl
 * @property {ZObjectStashFile} stashFile
 *
 *   /**
 *    *  Acts a lot like regular `JSON.parse`, but throws a nice error for improper json input
 *    *
 * @property {{
 *     parse: (text: string) => any;
 *     stringify: typeof JSON.stringify;
 * }} JSON
 *
 *   /**
 *    * Easily hash data using node's crypto package
 *    * @param algorithm probably 'sha256', see [this](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for more options
 *    * @param data the data you want to hash
 *    * @param encoding defaults to 'hex'
 *    * @param input_encoding defaults to 'binary'
 *    *
 * @property {
 *   (
 *     algorithm: string,
 *     data: string,
 *     encoding?: string,
 *     input_encoding?: string
 *   ) => string
 * } hash
 *
 * @property {{
 *     Error: typeof AppError;
 *     HaltedError: typeof HaltedError;
 *     ExpiredAuthError: typeof ExpiredAuthError;
 *     RefreshAuthError: typeof RefreshAuthError;
 *     ThrottledError: typeof ThrottledError;
 *   }} errors
 * }
 *
 * @typedef {Error} AppError
 */

/**
 * @typedef {Object} BundleMeta
 * @property {boolean} isBulkRead
 * @property {boolean} isFillingDynamicDropdown
 * @property {boolean} isLoadingSample
 * @property {boolean} isPopulatingDedupe
 * @property {boolean} isTestingAuth
 * @property {number} limit
 * @property {number} page
 * @property {{id: string}} zap?
 */

/**
 * @typedef {Partial} BundleRawRequest
 * @property {HttpMethod} method
 * @property {Object.<string,string>} headers
 * @property {string} content
 */

/**
 * @typedef {Partial|any} BundleCleanedRequest
 * @property {HttpMethod} method
 * @property {Object.<string,string>} querystring
 * @property {Object.<string,string>} headers
 * @property {Object.<string,string>} content
 */

/**
 * @typedef {SeaTableZapierBundle} Bundle
 * @property {Object.<string,string>} authData
 * @property {Object.<string,string>} InputData
 * @property {Object.<string,string>} inputDataRaw
 * @property {BundleMeta} meta
 * @property {BundleRawRequest} rawRequest?
 * @property {BundleCleanedRequest} cleanedRequest?
 * @property {Object} outputData?
 * @property {{id: string}} subscribeData?
 * @property {string} targetUrl?
 */

/**
 * @typedef {(|'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS'|'HEAD')} HttpMethod
 */

/**
 * @typedef {SeaTableZapierRequestOptions} HttpRequestOptions
 * @property {Agent} agent?
 * @property {string | Buffer | NodeJS.ReadableStream | object} body?
 * @property {boolean} compress?
 * @property {number} follow?
 * @property {Object<string,string>} headers?
 * @property {object|any[]} json?
 * @property {HttpMethod} method?
 * @property {object} params?
 * @property {boolean} raw?
 * @property {'manual' | 'error' | 'follow'} redirect?
 * @property {{params?: boolean, body?: boolean}} removeMissingValuesFrom?
 * @property {number} size?
 * @property {number} timeout?
 * @property {string} url?
 * @property {boolean} skipThrowForStatus?
 */

/**
 * @typedef {Object} BaseHttpResponse
 * @property {number} status
 * @property {Object<string, string>} headers
 * @property {function} getHeader ({string|undefined}: 0) (key: string)
 * @property {function} throwForStatus {void}
 * @property {boolean} skipThrowForStatus
 * @property {HttpRequestOptions} request
 */

/**
 * @typedef {Object} HttpResponse
 * @extends {BaseHttpResponse}
 * @property {string} content
 * @property {any} data?
 * @property {any} json?
 */

/**
 * @typedef {Object} RawHttpResponse
 * @property {Buffer} content
 * @property {Promise<object | undefined>} json
 * @property {NodeJS.ReadableStream} body
 * @property {number} status
 * @property {number} status
 * @property {number} status
 * @property {number} status
 * @property {number} status
 * @property {Object<string, string>} headers
 * @property {function} getHeader ({string|undefined}: 0) (key: string)
 * @property {boolean} skipThrowForStatus
 * @property {HttpRequestOptions} request
 * @property {function} throwForStatus {void}
 */
