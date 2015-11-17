module.exports = Object.freeze({

  // These are required parameters
  projectId: '',    // required, the project id, should ideally match a github repo name
  private: [],      // these files/directories can be automatically encrypted/decrypted, ideally before/after commit
  appDefs: {        // appDefs point
    pr: '',           // configuration file for pull request application deployment
    production: ''    // configuration file for production application deployment
    // ...
    // ...user defined...
    // ...
  }

});
