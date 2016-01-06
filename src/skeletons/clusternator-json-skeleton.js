var path = require('path');

module.exports = Object.freeze({

  // These are required parameters
  projectId: '',         // required, the project id, should ideally match a github repo name
  private: '.private',   // these files/directories can be automatically encrypted/decrypted, ideally before/after commit
  clusternatorDir: '.clusternator',

  // These are defaults
  deploymentsDir: path.join('.private', 'deployments'),
  useInternalSSL: false
});
