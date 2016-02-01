'use strict';
/**
 * This module is a utility module for middlewares that provides a list of
  instances that can be used with SSH
 * @module api/'0.1'/cli/log-ssh
 */

const cn = require('../js/js-api');
const clusternatorJson = require('../project-fs/clusternator-json');
const user = require('./user');
const NOT_AUTHENTICATED = 401;

module.exports = {
  listSSHAbleInstances
};

/**
 * @returns {Promise.<Array.<Object>>}
 */
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

