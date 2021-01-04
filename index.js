const authentication = require('./authentication');
const newRecordTrigger = require('./triggers/new_record.js');
const getTablesOfABaseTrigger = require('./triggers/get_tables_of_a_base.js');
const createRecordCreate = require('./creates/create_record.js');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: authentication,
  triggers: {
    [newRecordTrigger.key]: newRecordTrigger,
    [getTablesOfABaseTrigger.key]: getTablesOfABaseTrigger,
  },
  creates: { [createRecordCreate.key]: createRecordCreate },
};
