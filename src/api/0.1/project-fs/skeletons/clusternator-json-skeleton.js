var path = require('path');

module.exports = Object.freeze({

  // These are required parameters
  // required, the project id, should ideally match a github repo name
  projectId: '',
  // these files/directories can be automatically encrypted/decrypted, ideally
  // before/after commit
  private: '.private',
  clusternatorDir: '.clusternator',

  // These are defaults
  deploymentsDir: path.join('.private', 'deployments'),
  useInternalSSL: false,
  prTTL: 1000 * 60 * 60 * 24 * 3 // 3 days
});
