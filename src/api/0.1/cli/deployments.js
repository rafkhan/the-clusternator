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
 * The following is duplicate code
 */
const Q = require('q');
const nfs = require('fs');
const path = require('path');
const ls = Q.nbind(nfs.readdir, nfs);
const readFile = Q.nbind(nfs.readFile, nfs);
const UTF8 = 'utf8';
/**
 * Loads _all_ the contents of a given path, it assumes they're public keys
 * @param {string} keyPath
 * @returns {Promise<string[]>}
 */
function loadUserPublicKeys(keyPath) {
  return ls(keyPath).then((keyFiles) => {
    return Q.all(keyFiles.map((fileName) => {
      return readFile(path.join(keyPath, fileName), UTF8);
    }));
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
      const fullName = cJson.projectId + ':' + name;
      const sshPath = cJson.private + '/ssh-public';

      let appDef = null;

      return fs.read(dPath, 'utf8')
        .fail(getAppDefNotFound(dPath))
        .then((results) => {
          appDef = results;
          return loadUserPublicKeys(sshPath);
        })
        .then((keys) => {
          return cn.deploy(name, pid, appDef, keys, force);
        })
        .then((response) => {
          util.info('Successfully deployed ' + fullName , response);
        }, (err) => {
          util.error('Failed to deploy ' + fullName, err.stack);
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
    });
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
    .then((response) => {
      util.info('Successfully stopped deployment', response);
    }, (err) => {
      util.error(`Failed to stop deployment: ${err.message}`);
    });
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
