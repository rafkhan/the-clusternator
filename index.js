

const USER = require('./lib/config')().user,
  API = USER ?
    USER.apiVersion : require('./lib/constants').DEFAULT_API_VERSION;

module.exports = require('./lib/api')[API].js;
