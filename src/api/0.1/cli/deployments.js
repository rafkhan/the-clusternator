'use strict';

const Q = require('q');

const cn = require('../js/js-api');
const fs = require('../project-fs/fs');
const cmn = require('../common');

const git = cmn.src('cli-wrappers', 'git');
const util = cmn.src('util');

const clusternatorJson = cmn.src('clusternator-json');

module.exports = {
  deploy,
  update,
  stop
};

/**
 * @param {string} name
 * @returns {Q.Promise}
 */
function deploy(name) {
  return clusternatorJson
    .get()
    .then((cJson) => {
      var dPath = fs.path.join(cJson.deploymentsDir, name + '.json');
      return Q
        .all([
          git.shaHead(),
          fs.read(dPath, 'utf8')
            .fail(getAppDefNotFound(dPath))])
        .then((results) => cn
          .deploy(name, cJson.projectId, results[2], results[0]));
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
      var dPath = fs.path.join(cJson.deploymentsDir, name + '.json');
      return Q
        .all([
          git.shaHead(),
          fs.read(dPath, 'utf8')
            .fail(getAppDefNotFound(dPath))])
        .then((results) => cn
          .update(name, cJson.projectId, results[1], results[0]));
    });
}

function stop(name, sha) {
  return clusternatorJson
    .get()
    .then((cJson) => git
      .shaHead()
      .then((shaHead) => {
        sha = sha || shaHead;
        util.info('Stopping Deployment...: ', cJson.projectId, ': ', name,
          ' sha: ', sha);
        return cn.stop(name, cJson.projectId, sha);
      }));
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

