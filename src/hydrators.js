// https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#stashing-files
const stashFile = (z, bundle) => {
  // use standard auth to request the file
  const filePromise = z.request({
    url: bundle.inputData.downloadUrl,
    raw: true,
    redirect: 'error',
    skipHandleUndefinedJson: true,
  });
  // and swap it for a stashed URL
  return z.stashFile(filePromise);
};

module.exports = {
  stashFile,
};
