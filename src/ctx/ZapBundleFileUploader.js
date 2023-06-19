
/**
 * uploading files in Zapier
 * @link https://github.com/zapier/zapier-platform/blob/master/example-apps/files/creates/uploadFile_v10.js
 */

const http = require("https"); // require('http') if your URL is not https

const FormData = require("form-data");

/**
 * Getting a stream directly from http.
 *
 * This only works on core 10+. For core 9.x compatible code, see
 * uploadFile_v9.js.
 *
 * @link https://github.com/zapier/zapier-platform/blob/master/example-apps/files/creates/uploadFile_v10.js
 *
 * @param {string} url
 * @return {Promise<unknown>}
 */
const makeDownloadStream = (url) =>
  new Promise((resolve, reject) => {
    http.request(url, (res) => {
      // We can risk missing the first n bytes if we don't pause!
      res.pause();
    }).on("error", reject).on("response", (res) => {
      resolve(res);
    }).end();
  });

/**
 * @type {RegExp} upload valid filename matcher
 */
const matcher= /^.+\.[a-zA-Z0-9]{3,4}$/;

/**
 * SeaTable File Uploader (ZapBundle)
 */
class ZapBundleFileUploader {
  /**
   * @type {ZapBundle} #zb
   */
  #zb;

  /**
   * @type {RegExp} #matcher
   */
  #matcher;

  /**
   * @param {ZapBundle} zb
   */
  constructor(zb) {
    this.#zb = zb;
    this.#matcher = matcher;
  }

  /**
   *
   * @return {Promise<UploadLink>}
   */
  async getUploadLink(z) {
    const resp = await z.request({
      url: `${this.#zb.bundle.authData.server}/api/v2.1/dtable/app-upload-link/`,
      method: 'GET',
      headers: {Authorization: `Token ${this.#zb.bundle.authData.api_token}`},
    });
    return resp.data;
  }

  /**
   *
   * @param {UploadLink} uploadLink
   * @param {string} filename the file's basename
   * @param {UploadAssetType} uploadAssetType
   * @return {Promise<string>}
   */
  async getAssetUrlFromUpload(uploadLink, filename, uploadAssetType) {
    const dtable = await this.#zb.dtable;
    return `${dtable.server_address}/workspace/${dtable.workspace_id}${uploadLink.parent_path}/` +
        `${uploadAssetType === "image" ?
            uploadLink.img_relative_path :
            uploadLink.file_relative_path}/` +
        `${filename}`;
  }

  /**
   *
   * @param {UploadLink} uploadLink
   * @param {UploadResult} uploadResult
   * @param {UploadAssetType} uploadAssetType
   * @return {Promise<DTableAssetAny>}
   */
  async getAssetData(uploadLink, uploadResult, uploadAssetType) {
    const fileUrl = await this.getAssetUrlFromUpload(
        uploadLink, uploadResult.name, uploadAssetType,
    );

    if (uploadAssetType === "file") {
      return {
        name: uploadResult.name,
        size: uploadResult.size,
        type: uploadAssetType,
        url: fileUrl,
      };
    }

    if (uploadAssetType === "image") {
      return fileUrl;
    }
  }

  /**
   *
   * @param {string} url
   * @param {string} filename
   * @param {boolean} isFilenameAuthoritative false: overwrite filename (@in-param filename) if in stream / true: enforce filename (@in-param filename), ignore stream
   * @param {UploadLink} uploadLink
   * @param {UploadAssetType} type
   * @param {boolean} replace
   * @return {Promise<UploadResult>}
   */
  async postUploadToLinkFromUrl(url, filename, isFilenameAuthoritative, uploadLink, type = "file", replace = false) {
    const stream = await makeDownloadStream(url);
    stream.downloadStreamUrl = url;

    const relativePathMember = type === "image" ?
        "img_relative_path" :
        "file_relative_path";

    const form = new FormData();

    if (false === isFilenameAuthoritative) {
      for (const attachmentFilename of this.getStreamAttachmentFilename(stream)) {
        filename = attachmentFilename;
      }
    }

    form.append("file", stream, filename);
    form.append("parent_dir", uploadLink.parent_path);
    form.append("replace", replace ? "1" : "0");
    form.append("relative_path", uploadLink[relativePathMember]);

    // All set! Resume the stream
    stream.resume();

    // POST Upload File/Image via Upload Link
    // https://api.seatable.io/#d9a82590-0600-42cc-81c5-5ce6ef9fe628
    const {data: [result]} = await this.#zb.request({
      url: `${uploadLink.upload_link}?ret-json=true`,
      method: "POST",
      body: form,
    });

    return result;
  }

  /**
   * yield attachment filename from stream
   *
   * Content-Disposition: attachment; filename="..." in headers.
   *
   * example:
   *  URL: https://zapier-dev-files.s3.amazonaws.com/cli-platform/19332/qNgsyf_ouV1J7Pqjtt5OrUDSPUMYbXLvP6hejpdiLtI05AnqxXrDoLpAzcmz2yJpOpxzb_cY1H89YR3PWKKkTSsdnOpnzNt0yNPfNQJDMuazk6vtsVVCelRKddRq-0fJ2o_gKiERlYbU3vwA7tFJ0OmcfdD8o7x0WcYu1ZtzUG0
   *  header:
   *    'content-disposition': 'attachment; filename="Sample Sales Proposal_Tww2cynVrqMJxGHrd5rWzU.pdf"'
   *
   * @param {*} stream
   */
  * getStreamAttachmentFilename(stream) {
    console.log("response:content-disposition(headers)", stream.headers);

    if (stream.headers?.["content-disposition"]) {
      const contentDisposition = stream.headers["content-disposition"];
      console.log("response:content-disposition(full)", contentDisposition);
      const result = contentDisposition?.match(/^attachment; filename="(?<filename>[^"]+)"$/);
      console.log("response:content-disposition(match)", result);
      if (result && this.testFilename(result?.groups?.filename)) {
        yield result.groups.filename;
      }
    }
  }

  /**
   * test for filename
   *
   * @param {any} subject commonly a string, but dealing with other types incl. undefined as test negation (fail-safe)
   * @return {boolean}
   */
  testFilename(subject = undefined) {
    if (!subject || "string" !== typeof subject) {
      return false;
    }

    return this.#matcher.test(subject);
  }

  /**
   * filename form url (heuristic)
   *
   * default strategy is to take the last part to allow ?/filename.ext append hack.
   *
   * filename to be used in the upload against seatable from zapier input url for uploading
   *
   * compare {@see {AssetUrlInfo.urlGetBasename}}
   * @param {string} url upload-url
   * @param {string} fallback [optional] filename
   * @return {string} filename
   */
  getUploadFilenameFromUrl(url, fallback = "Unnamed attachment") {
    const lastPart = url.split("/")?.pop();
    if (!lastPart || "string" !== typeof lastPart) {
      return fallback;
    }
    const uploadFilename = decodeURIComponent(lastPart);

    if (!uploadFilename || "string" !== typeof uploadFilename) {
      return fallback;
    }

    return this.#matcher.test(uploadFilename) ? uploadFilename : fallback;
  }

  /**
   * @param {string} uploadUrl
   * @param {UploadAssetType} uploadAssetType
   * @return {Promise<DTableAssetAny>}
   */
  async uploadUrlAssetPromise(z, uploadUrl, uploadAssetType) {
    const fileFallback = /* isFilenameAuthoritative */ Boolean(false);
    const fileOverwrite = Boolean(false);

    
    // try to get a filename from the url
    // in case of hydrated file it delivers: Unnamed attachment
    const uploadFilename = this.getUploadFilenameFromUrl(uploadUrl);
    z.console.log("DEBUG uploadfilename", uploadFilename);

    // get upload link
    const uploadLink = await this.getUploadLink(z);
    z.console.log("DEBUG uploadLink", uploadLink)

    const uploadResult = await this.postUploadToLinkFromUrl(
        uploadUrl, uploadFilename, fileFallback, uploadLink, uploadAssetType, fileOverwrite,
    );
    z.console.log("DEBUG uploadResult", uploadResult);

    return await this.getAssetData(uploadLink, uploadResult, uploadAssetType);
  }
}

module.exports = {
  ZapBundleFileUploader,
};
