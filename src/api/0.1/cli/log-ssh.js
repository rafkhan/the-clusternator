'use strict';
const cn = require('../js/js-api');
const clusternatorJson = require('../project-fs/clusternator-json');
const user = require('./user');
const NOT_AUTHENTICATED = 401;

module.exports = {
  listSSHAbleInstances
};

function listSSHAbleInstances() {
  return clusternatorJson
    .get()
    .then((cJson) => cn
      .listSSHAbleInstances(cJson.projectId)
      .fail((err) => {
        if (+err.code === NOT_AUTHENTICATED) {
          return user.login()
            .then(listSSHAbleInstances);
        }
        throw err;
      }));
}

