'use strict';
/**
 * This module is a middleware that sits between {@link module:api/'0.1'/cli}
 and {@link module:api/'0.1'/clusternator}
 * @module api/'0.1'/cli/cloudService
 */
const R = require('ramda');

let cn = require('../js/js-api');
const fs = require('../project-fs/project-fs');

const cmn = require('../common');

const git = cmn.src('cli-wrappers', 'git');
const util = cmn.src('util');

const constants = require('../../../constants');

const clusternatorJson = require('../project-fs/clusternator-json');

module.exports = {
  deploy,
  update,
  stop
};

/**
 * @param {string} name
 * @returns {Q.Promise}
 */
function deploy(name, force, update) {
  return clusternatorJson
    .get()
    .then((cJson) => {
      const dPath = fs.path.join(cJson.deploymentsDir, name + '.json');
      const pid = cJson.projectId;
      return fs
        .read(dPath, 'utf8')
        .fail(getAppDefNotFound(dPath))
        .then((results) => cn.deploy(name, pid, results, null, force));
    });
}

/**
 * @param {string} name
 * @returns {Q.Promise}
 */
function update(name) {
  return clusternatorJson
    .get()
    .then((cJson) => {
      const dPath = fs.path.join(cJson.deploymentsDir, name + '.json');
      return fs
        .read(dPath, 'utf8')
        .fail(getAppDefNotFound(dPath))
        .then((results) => cn
          .update(name, cJson.projectId, results));
    })
    .fail((err) => util
      .error(`Failed to update deployment: ${err.message}`));
}

/**
 * @param {string} name
 * @returns {Request|Promise.<T>|*}
 */
function stop(name) {
  return clusternatorJson
    .get()
    .then((cJson) => {
      util.info('Stopping Deployment...: ', cJson.projectId, ': ', name);
      return cn.stop(name, cJson.projectId);
    })
    .fail((err) => util
      .error(`Failed to stop deployment: ${err.message}`));
}

/**
 * @param {string} dPath
 * @returns {function(err:Error)}
 */
function getAppDefNotFound(dPath) {
  return (err) => {
    util.info(`Deployment AppDef Not Found In: ${dPath}: ${err.message}`);
    throw err;
  };
}

