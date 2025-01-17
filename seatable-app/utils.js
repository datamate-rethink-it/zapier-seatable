const FormData = require("form-data");
const http = require("https");
const hydrators = require("./hydrators");

// INTERNAL: split asset path.
function getAssetPath(type, url) {
  const parts = url.split(`/${type}/`);
  if (parts[1]) {
    return "/" + type + "/" + parts[1];
  }
  return url;
}

// INTERNAL: get collaborator info from @auth.local address
function getCollaboratorInfo(authLocal, collaboratorList) {
  return (
    collaboratorList.find(
      (singleCollaborator) => singleCollaborator.email === authLocal
    ) || {
      contact_email: null,
      name: null,
      email: null,
    }
  );
}

function collaboratorInfo(collaborators, username) {
  for (const collaborator of collaborators) {
    if (collaborator.email === username) {
      return collaborator;
    }
  }
}

function enrichColumns(row, metadata, collaboratorList) {
  Object.keys(row).forEach((key) => {
    const columnDef = metadata.find(
      (obj) => obj.name === key || obj.key === key
    );

    if (columnDef?.type === "single-select") {
      const selectedId = row[key];
      if (selectedId && columnDef.data && columnDef.data.options) {
        const selectedOption = columnDef.data.options.find(
          (option) => option.id === selectedId.toString()
        );
        if (selectedOption) {
          row[key] = selectedOption.name;
        }
      }
    }

    if (columnDef?.type === "multiple-select") {
      const selectedIds = row[key];
      if (
        Array.isArray(selectedIds) &&
        columnDef.data &&
        columnDef.data.options
      ) {
        row[key] = selectedIds
          .map((id) => {
            const selectedOption = columnDef.data.options.find(
              (option) => option.id === id.toString()
            );
            return selectedOption ? selectedOption.name : id;
          })
          .filter(Boolean);
      }
    }

    // collaborator can have multiple entries. Therefore not same code like _creator or _last_modifier
    if (columnDef?.type === "collaborator") {
      const collaborators = row[key] || [];
      if (collaborators.length > 0) {
        row[key] = collaborators.map((email) => {
          const { contact_email, name } = getCollaboratorInfo(
            email,
            collaboratorList
          );
          return { email, contact_email, name };
        });
      }
    }

    if (
      columnDef?.type === "last-modifier" ||
      columnDef?.type === "creator" ||
      key === "_creator" ||
      key === "_last_modifier"
    ) {
      const { contact_email, name } = getCollaboratorInfo(
        row[key],
        collaboratorList
      );
      row[key] = { email: row[key], contact_email, name };
    }

    if (columnDef?.type === "image") {
      const pictures = row[key] || [];
      if (pictures.length > 0) {
        row[key] = pictures.map((url) => ({
          name: url.split("/").pop(),
          size: 0,
          type: "image",
          url,
          path: getAssetPath("images", url),
        }));
      }
    }

    if (columnDef?.type === "file") {
      const files = row[key] || [];
      files.forEach((file) => {
        file.path = getAssetPath("files", file.url);
      });
    }

    if (columnDef?.type === "digital-sign") {
      const digitalSignature = row[key];
      if (digitalSignature?.username) {
        const { contact_email, name } = getCollaboratorInfo(
          digitalSignature.username,
          collaboratorList
        );
        const updatedSignature = {
          username: digitalSignature.username,
          path: digitalSignature.sign_image_url,
          sign_time: digitalSignature.sign_time,
          contact_email,
          name,
        };
        row[key] = [updatedSignature];
      } else {
        row[key] = [];
      }
    }

    if (columnDef?.type === "button") {
      delete row[key];
    }
  });

  return row;
}

const getPublicDownloadLink = async (asset_path, z, bundle) => {
  //console.log("asset_path", asset_path);
  try {
    const response = await z.request({
      method: "GET",
      url: `${bundle.authData.serverUrl}/api/v2.1/dtable/app-download-link/`,
      params: { path: asset_path },
      skipEncodingChars: "/@%",
    });
    return response.data.download_link;
  } catch (error) {
    console.error(
      `Error getting download link for ${asset_path}:`,
      error.message
    );
    return null;
  }
};

const getUploadLink = async (z, bundle) => {
  const response = await z.request({
    method: "GET",
    url: `${bundle.authData.serverUrl}/api/v2.1/dtable/app-upload-link/`,
    skipEncodingChars: "/@%",
  });

  return response.json;
};

const extractFilename = (stream, url) => {
  // Extract from Content-Disposition header
  const fromHeader = stream.headers["content-disposition"]?.match(
    /^attachment; filename="(?<filename>[^"]+)"$/
  )?.groups?.filename;
  const fromURL = new URL(url).pathname.split("/").pop();
  const fallback = "file";

  return fromHeader ?? fromURL ?? fallback;
};

// type is either "file" or "image"
const uploadFile = async (z, uploadLink, file, type) => {
  const stream = await makeDownloadStream(file, z);

  const formData = new FormData();

  formData.append("file", stream, {
    filename: extractFilename(stream, file),
    contentType: "application/octet-stream",
  });

  stream.resume();

  formData.append("parent_dir", uploadLink.parent_path);
  formData.append(
    "relative_path",
    type === "file"
      ? uploadLink.file_relative_path
      : uploadLink.img_relative_path
  );

  const options = {
    method: "POST",
    url: uploadLink.upload_link,
    params: {
      "ret-json": 1,
    },
    headers: {
      ...formData.getHeaders(),
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  };

  const response = await z.request(options);

  return response.data[0];
};

const makeDownloadStream = (url) =>
  new Promise((resolve, reject) => {
    http
      .request(url, (res) => {
        // We can risk missing the first n bytes if we don't pause!
        res.pause();
        resolve(res);
      })
      .on("error", reject)
      .end();
  });

const processRowsForDownloadLinks = async (rows, z, bundle, download) => {
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item.path) {
            if (download !== "yes") {
              item.public_download_link = null;
              item.file = null;
            } else {
              // uploaded file or just a link to an image
              if (item.path === item.url) {
                item.public_download_link = item.path;
                item.file = z.dehydrateFile(hydrators.downloadFile, {
                  url: item.path,
                });
              } else {
                const downloadLink = await getPublicDownloadLink(
                  item.path,
                  z,
                  bundle
                );
                if (downloadLink) {
                  item.public_download_link = downloadLink;
                  item.file = z.dehydrateFile(hydrators.downloadFile, {
                    url: downloadLink,
                  });
                } else {
                  item.public_download_link = "error";
                }
              }
            }
          }
        }
      }
    }
  }
  return rows;
};

const getCollaborators = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.serverUrl}/api-gateway/api/v2/dtables/${bundle.authData.baseUuid}/related-users/`,
  });

  return response.json.user_list;
};

module.exports = {
  enrichColumns,
  processRowsForDownloadLinks,
  collaboratorInfo,
  getPublicDownloadLink,
  getAssetPath,
  getCollaborators,
  getUploadLink,
  uploadFile,
};
