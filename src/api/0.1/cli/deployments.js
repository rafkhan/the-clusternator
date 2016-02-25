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

const getTagsFromInstances = R.map((inst) => {
  const tagObj = R.reduce((memo, t) => {
    memo[t.Key] = t.Value;
    return memo;
  }, {}, inst.Tags);

  return tagObj;
});

// Move to deployment manager?
function deploymentExists(projectId, name) {

  return cn.listDeployments(projectId)
          .then((deployments) => {
            const getInstances = R.compose(R.flatten, R.map((d) => {
              return getTagsFromInstances(d.Instances);
            }));

            const insts = getInstances(deployments);
            deployments = R.map(R.prop(constants.DEPLOYMENT_TAG), insts);

            return R.contains(name, deployments);
          });
}

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
        .then((results) => {

          return deploymentExists(cJson.projectId, name).then((exists) => {
            if(exists) {
              if(force) {
                // Kill deployment, rebuild
                return cn.stop(name, pid).then(() => {
                  return cn.deploy(name, pid, results[1], results[0]);
                });
              } else if(update) {
                // Update in place
                return cn.update(name, pid, results);
              } else {
                // Notify user that it already exists 
                return console.log('already exists.');
              }
            } else {
              // Just launch it
              return cn.deploy(name, pid, results[1], results[0]);
            }
          });
        });
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

